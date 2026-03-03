/**
 * Execution Simulator — frontend-only runtime that simulates workflow execution
 * step-by-step with realistic artifacts: logs, token usage, cost, timing.
 * All simulation decisions are deterministic from workflow JSON.
 */

import type {
  PipelineNode,
  PipelineEdge,
  ExecutionRun,
  ExecutionResult,
  ExecutionPlan,
} from "../types";
import { compileGraph } from "./graphCompiler";

// ── Pseudo-random from seed (deterministic) ───────────────────────────────────
function seededRandom(seed: number): () => number {
  let s = seed;
  return function () {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

// ── Mock log generator ────────────────────────────────────────────────────────
function generateLogs(nodeType: string, rng: () => number): string[] {
  const ts = () => new Date().toISOString();
  const base: Record<string, string[][]> = {
    llm: [
      [`[${ts()}] INFO  Sending prompt to model...`, `[${ts()}] INFO  Received ${Math.floor(rng() * 800 + 200)} tokens`, `[${ts()}] INFO  Completion successful`],
      [`[${ts()}] INFO  Token usage: prompt=${Math.floor(rng()*400+100)}, completion=${Math.floor(rng()*600+200)}`, `[${ts()}] DEBUG Model temperature: 0.7`],
    ],
    aiAgent: [
      [`[${ts()}] INFO  Agent started`, `[${ts()}] DEBUG Iteration 1/5`, `[${ts()}] INFO  Tool call: web_search`, `[${ts()}] INFO  Agent completed in ${Math.floor(rng()*3+1)} iterations`],
    ],
    http: [
      [`[${ts()}] INFO  GET https://api.example.com/v1/data`, `[${ts()}] INFO  Response 200 OK in ${Math.floor(rng()*300+50)}ms`],
      [`[${ts()}] INFO  POST https://api.example.com/v1/submit`, `[${ts()}] DEBUG Headers: Content-Type: application/json`, `[${ts()}] INFO  Response 201 Created`],
    ],
    webhook: [
      [`[${ts()}] INFO  Webhook received at /webhook`, `[${ts()}] DEBUG Payload size: ${Math.floor(rng()*1024+64)} bytes`, `[${ts()}] INFO  Trigger activated`],
    ],
    postgresql: [
      [`[${ts()}] INFO  Connected to PostgreSQL`, `[${ts()}] DEBUG Query: SELECT * FROM users...`, `[${ts()}] INFO  ${Math.floor(rng()*50+1)} rows returned`],
    ],
    telegramBot: [
      [`[${ts()}] INFO  Sending Telegram message`, `[${ts()}] INFO  Message delivered (id=${Math.floor(rng()*99999+1000)})`],
    ],
    if: [
      [`[${ts()}] INFO  Evaluating condition...`, `[${ts()}] INFO  Condition result: ${rng() > 0.5 ? "TRUE" : "FALSE"}`, `[${ts()}] DEBUG Routing to ${rng() > 0.5 ? "true" : "false"} branch`],
    ],
    default: [
      [`[${ts()}] INFO  Executing node...`, `[${ts()}] INFO  Node completed`],
    ],
  };

  const variants = base[nodeType] ?? base.default;
  const variant = variants[Math.floor(rng() * variants.length)];
  return variant;
}

// ── Token usage for LLM nodes ─────────────────────────────────────────────────
function generateTokenUsage(
  nodeType: string,
  rng: () => number
): { prompt: number; completion: number; total: number } | undefined {
  if (!["llm", "aiAgent", "ragPipeline", "embedding"].includes(nodeType)) return undefined;
  const prompt = Math.floor(rng() * 500 + 100);
  const completion = Math.floor(rng() * 800 + 200);
  return { prompt, completion, total: prompt + completion };
}

// ── Cost per token ────────────────────────────────────────────────────────────
const TOKEN_COSTS: Record<string, number> = {
  llm: 0.003,
  aiAgent: 0.005,
  ragPipeline: 0.002,
  embedding: 0.0001,
};

// ── Simulate one step ─────────────────────────────────────────────────────────
async function simulateStep(
  node: PipelineNode,
  stepIndex: number,
  onUpdate: (result: ExecutionResult) => void,
  delay: number
): Promise<ExecutionResult> {
  const rng = seededRandom(stepIndex * 31337 + node.id.charCodeAt(0));
  const nodeType = node.data.nodeType ?? "unknown";

  // Simulate processing time
  await new Promise<void>((r) => setTimeout(r, delay + Math.floor(rng() * 200)));

  const tokenUsage = generateTokenUsage(nodeType, rng);
  const logs = generateLogs(nodeType, rng);
  const durationMs = Math.floor(rng() * 600 + 100);

  // ~5% chance of failure for non-trigger nodes
  const shouldFail =
    !["webhook", "timer", "customInput", "telegramTrigger", "discordTrigger"].includes(nodeType) &&
    rng() < 0.05;

  const result: ExecutionResult = {
    stepId: `step-${stepIndex}`,
    nodeId: node.id,
    status: shouldFail ? "failed" : "success",
    output: shouldFail
      ? undefined
      : {
          data: `[Simulated output from ${nodeType}]`,
          timestamp: Date.now(),
          tokens: tokenUsage?.total,
        },
    error: shouldFail
      ? `SimulatedError: ${nodeType} node failed (mock 5% failure rate)`
      : undefined,
    tokenUsage,
    durationMs,
    logs: shouldFail
      ? [...logs, `[ERROR] ${nodeType} execution failed`]
      : logs,
    timestamp: Date.now(),
  };

  onUpdate(result);
  return result;
}

// ── Main runner ───────────────────────────────────────────────────────────────
export interface SimulatorCallbacks {
  onStepStart: (nodeId: string) => void;
  onStepComplete: (result: ExecutionResult) => void;
  onRunComplete: (run: ExecutionRun) => void;
  onRunFailed: (error: string, run: ExecutionRun) => void;
}

export async function runSimulation(
  nodes: PipelineNode[],
  edges: PipelineEdge[],
  callbacks: SimulatorCallbacks,
  speedMs = 600
): Promise<ExecutionRun> {
  const runId = `run-${Date.now()}`;
  const { plan } = compileGraph(nodes, edges);

  const run: ExecutionRun = {
    id: runId,
    startedAt: Date.now(),
    status: "running",
    plan,
    results: [],
    totalTokens: 0,
    totalCostUSD: 0,
  };

  const nodeMap = new Map(nodes.map((n) => [n.id, n]));

  try {
    for (let i = 0; i < plan.steps.length; i++) {
      const step = plan.steps[i];
      const node = nodeMap.get(step.nodeId);
      if (!node) continue;

      callbacks.onStepStart(step.nodeId);

      const result = await simulateStep(
        node,
        i,
        callbacks.onStepComplete,
        speedMs
      );

      run.results.push(result);

      if (result.tokenUsage) {
        run.totalTokens += result.tokenUsage.total;
        const cost = TOKEN_COSTS[step.nodeType] ?? 0;
        run.totalCostUSD += (result.tokenUsage.total / 1000) * cost;
      }

      // Stop if a step failed and no error boundary
      if (result.status === "failed") {
        run.status = "failed";
        run.completedAt = Date.now();
        callbacks.onRunFailed(result.error ?? "Unknown error", run);
        return run;
      }
    }

    run.status = "success";
    run.completedAt = Date.now();
    callbacks.onRunComplete(run);
    return run;
  } catch (err) {
    run.status = "failed";
    run.completedAt = Date.now();
    callbacks.onRunFailed(String(err), run);
    return run;
  }
}

// ── Format helpers ────────────────────────────────────────────────────────────
export function formatCost(usd: number): string {
  if (usd < 0.0001) return "< $0.0001";
  return "$" + usd.toFixed(4);
}

export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}
