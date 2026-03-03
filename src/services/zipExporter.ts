/**
 * ZIP Exporter
 *
 * Generates runnable starter projects for multiple deployment targets:
 * - React SPA
 * - Node API
 * - Fullstack Docker (React + Node)
 * - Telegram / Discord / WhatsApp bots
 * - WordPress plugin bridge + backend API
 */

import JSZip from "jszip";
import { getNodeDefinition } from "../nodes/definitions";
import type { ExportProjectType, PipelineEdge, PipelineNode } from "../types";
import { compileGraph } from "./graphCompiler";
import { generateMasterPrompt } from "./masterPromptGenerator";

interface ExportContext {
  workflowName: string;
  projectType: ExportProjectType;
  slug: string;
  workflowJson: string;
  masterPrompt: string;
  envVars: Record<string, string>;
  nodeCount: number;
  edgeCount: number;
}

function slugify(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "aura-workflow";
}

function toEnvKey(input: string): string {
  return input
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function asPrettyJson(value: unknown): string {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function ensureFolder(zip: JSZip, name: string): JSZip {
  const folder = zip.folder(name);
  if (!folder) throw new Error(`Could not create folder: ${name}`);
  return folder;
}

function projectLabel(projectType: ExportProjectType): string {
  const labels: Record<ExportProjectType, string> = {
    "react-spa": "React SPA",
    "node-api": "Node API",
    "fullstack-docker": "Fullstack Docker",
    "telegram-bot": "Telegram Bot",
    "discord-bot": "Discord Bot",
    "whatsapp-bot": "WhatsApp Bot",
    "wordpress-plugin": "WordPress Plugin + Backend",
  };
  return labels[projectType];
}

function collectEnvVars(
  nodes: PipelineNode[],
  projectType: ExportProjectType,
): Record<string, string> {
  const env = new Map<string, string>();

  const setEnv = (key: string, value: string) => {
    if (!env.has(key)) env.set(key, value);
  };

  setEnv("NODE_ENV", "development");
  setEnv("PORT", "8000");
  setEnv("GEMINI_API_KEY", "");

  if (projectType === "react-spa" || projectType === "fullstack-docker") {
    setEnv("VITE_API_BASE", "http://localhost:8000");
  }

  if (projectType === "telegram-bot") {
    setEnv("TELEGRAM_BOT_TOKEN", "");
    setEnv("BACKEND_URL", "http://localhost:8000");
  }

  if (projectType === "discord-bot") {
    setEnv("DISCORD_BOT_TOKEN", "");
    setEnv("BACKEND_URL", "http://localhost:8000");
  }

  if (projectType === "whatsapp-bot") {
    setEnv("TWILIO_ACCOUNT_SID", "");
    setEnv("TWILIO_AUTH_TOKEN", "");
    setEnv("TWILIO_WHATSAPP_NUMBER", "whatsapp:+14155238886");
    setEnv("BACKEND_URL", "http://localhost:8000");
    setEnv("BOT_PORT", "3100");
  }

  if (projectType === "wordpress-plugin") {
    setEnv("WORDPRESS_BRIDGE_API_KEY", "");
  }

  for (const node of nodes) {
    const definition = getNodeDefinition(node.data.nodeType ?? "");
    const creds = definition?.requiredCredentials ?? [];

    for (const cred of creds) {
      const nodeKey = toEnvKey(node.data.label ?? node.data.nodeType ?? node.id);
      const credKey = toEnvKey(cred.key);
      const key = `${nodeKey}_${credKey}`;
      setEnv(key, cred.secret ? "" : "your_value_here");
    }
  }

  return Object.fromEntries(env.entries());
}

function genEnvTemplate(ctx: ExportContext): string {
  const lines: string[] = [
    "# Aura Engine generated environment template",
    "# Copy this file to .env and fill required values",
    "",
  ];

  for (const [key, value] of Object.entries(ctx.envVars)) {
    lines.push(`${key}=${value}`);
  }

  lines.push("", "# End of file");
  return `${lines.join("\n")}\n`;
}

function genGitignore(): string {
  return [
    "node_modules",
    ".env",
    "dist",
    ".DS_Store",
    "*.log",
    ".turbo",
    "coverage",
  ].join("\n");
}

function genRootReadme(ctx: ExportContext): string {
  const label = projectLabel(ctx.projectType);

  const projectSpecificNextSteps: Record<ExportProjectType, string[]> = {
    "react-spa": [
      "Set `VITE_API_BASE` to your API endpoint if not running local backend.",
      "Run `npm run dev` to launch the React app.",
    ],
    "node-api": [
      "Run `npm run dev` to start backend API on port 8000.",
      "POST workflow inputs to `http://localhost:8000/api/run`.",
    ],
    "fullstack-docker": [
      "Run `npm run dev` for local multi-service development.",
      "Or run `docker compose up --build` for containerized stack.",
    ],
    "telegram-bot": [
      "Fill `TELEGRAM_BOT_TOKEN` in `.env`.",
      "Run `npm run dev` to start backend and Telegram bot.",
    ],
    "discord-bot": [
      "Fill `DISCORD_BOT_TOKEN` in `.env`.",
      "Run `npm run dev` to start backend and Discord bot.",
    ],
    "whatsapp-bot": [
      "Fill Twilio credentials in `.env`.",
      "Expose bot port with ngrok and connect Twilio webhook to `/twilio/webhook`.",
    ],
    "wordpress-plugin": [
      "Install plugin from `wordpress-plugin/` into your WordPress site.",
      "Set backend endpoint and optional API key in plugin settings.",
      "Run backend locally with `npm run dev` or deploy backend separately.",
    ],
  };

  return `# ${ctx.workflowName}\n\nGenerated by Aura Engine as a **${label}** starter.\n\n## Workflow Snapshot\n- Nodes: ${ctx.nodeCount}\n- Edges: ${ctx.edgeCount}\n- Project type: ${ctx.projectType}\n\n## Quick Start\n\`\`\`bash\ncp .env.template .env\nnpm install\nnpm run dev\n\`\`\`\n\n## Next Steps\n${projectSpecificNextSteps[ctx.projectType].map((step) => `- ${step}`).join("\n")}\n\n## Files\n- \`workflow.json\`: graph + execution plan\n- \`master-prompt.txt\`: system prompt snapshot\n- \`.env.template\`: required configuration\n\n## Master Prompt\n\`\`\`text\n${ctx.masterPrompt}\n\`\`\`\n`;
}

function genRootPackageJson(ctx: ExportContext): Record<string, unknown> {
  const includeBackend = ctx.projectType !== "react-spa";
  const includeFrontend =
    ctx.projectType === "react-spa" || ctx.projectType === "fullstack-docker";
  const includeBot = ["telegram-bot", "discord-bot", "whatsapp-bot"].includes(
    ctx.projectType,
  );

  const workspaces: string[] = [];
  if (includeFrontend) workspaces.push("frontend");
  if (includeBackend) workspaces.push("backend");
  if (includeBot) workspaces.push("bot");

  const scripts: Record<string, string> = {
    build: "echo \"No root build configured\"",
  };

  const dependencies: Record<string, string> = {};

  if (includeFrontend && includeBackend) {
    scripts.dev =
      'concurrently "npm --workspace backend run dev" "npm --workspace frontend run dev"';
    scripts.start =
      'concurrently "npm --workspace backend run start" "npm --workspace frontend run start"';
    dependencies.concurrently = "^8.2.2";
  } else if (includeBot && includeBackend) {
    scripts.dev =
      'concurrently "npm --workspace backend run dev" "npm --workspace bot run dev"';
    scripts.start =
      'concurrently "npm --workspace backend run start" "npm --workspace bot run start"';
    dependencies.concurrently = "^8.2.2";
  } else if (includeBackend) {
    scripts.dev = "npm --workspace backend run dev";
    scripts.start = "npm --workspace backend run start";
  } else if (includeFrontend) {
    scripts.dev = "npm --workspace frontend run dev";
    scripts.start = "npm --workspace frontend run start";
    scripts.build = "npm --workspace frontend run build";
  }

  return {
    name: `${ctx.slug}-aura-export`,
    version: "1.0.0",
    private: true,
    description: `Generated by Aura Engine (${ctx.projectType})`,
    workspaces,
    scripts,
    ...(Object.keys(dependencies).length > 0 ? { dependencies } : {}),
  };
}

function genBackendServerJs(workflowName: string): string {
  return `const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const workflow = require("./workflow.json");
const { runWorkflow, summarizeOutput } = require("./workflow-engine");

dotenv.config();

const app = express();
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: "2mb" }));

app.get("/health", (_req, res) => {
  res.json({
    ok: true,
    service: "aura-backend",
    workflow: "${workflowName}",
    nodes: workflow.nodes?.length ?? 0,
    edges: workflow.edges?.length ?? 0,
    timestamp: new Date().toISOString(),
  });
});

app.get("/api/workflow", (_req, res) => {
  res.json({
    name: workflow.name ?? "${workflowName}",
    nodes: workflow.nodes?.length ?? 0,
    edges: workflow.edges?.length ?? 0,
    planSteps: workflow.plan?.steps?.length ?? 0,
    warnings: workflow.plan?.warnings ?? [],
  });
});

app.post(["/api/run", "/webhook"], async (req, res) => {
  const startedAt = Date.now();
  try {
    const payload = req.body ?? {};
    const execution = await runWorkflow(payload, {
      geminiApiKey: process.env.GEMINI_API_KEY || "",
    });

    res.json({
      ok: true,
      durationMs: Date.now() - startedAt,
      output: execution.output,
      outputSummary: summarizeOutput(execution.output),
      trace: execution.trace,
      nodeResults: execution.results,
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : "Unknown workflow error",
      durationMs: Date.now() - startedAt,
    });
  }
});

const port = Number(process.env.PORT || 8000);
app.listen(port, () => {
  console.log(`[aura-backend] listening on http://localhost:${port}`);
});
`;
}

function genBackendEngineJs(): string {
  return `const workflow = require("./workflow.json");

const GEMINI_MODELS = [
  "gemini-3.0-flash",
  "gemini-2.5-flash-preview-04-17",
  "gemini-1.5-flash",
];

function asObject(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function stringifyValue(value) {
  if (value == null) return "";
  if (typeof value === "string") return value;
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function buildPrompt(node, input) {
  const data = asObject(node.data);
  const config = asObject(data.config);
  const prompt =
    config.prompt ??
    config.template ??
    data.prompt ??
    data.systemPrompt ??
    "Process this input and return a concise useful response.";

  return `${prompt}\n\nINPUT:\n${stringifyValue(input)}`;
}

function evaluateCondition(expression, input, results) {
  try {
    const fn = new Function("input", "results", `return Boolean(${expression});`);
    return Boolean(fn(input, results));
  } catch {
    return false;
  }
}

function renderTemplate(template, input) {
  const text = String(template || "");
  return text.replace(/\{\{\s*([^}]+)\s*\}\}/g, (_, path) => {
    const keys = String(path).split(".");
    let current = input;
    for (const key of keys) {
      if (current == null) return "";
      current = current[key];
    }
    return current == null ? "" : String(current);
  });
}

async function callGemini(prompt, apiKey) {
  if (!apiKey) {
    return {
      model: null,
      text: "Gemini API key missing. Returning fallback output.",
      fallback: true,
      prompt,
    };
  }

  for (const model of GEMINI_MODELS) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.3,
              maxOutputTokens: 2048,
            },
          }),
        },
      );

      if (!response.ok) continue;
      const data = await response.json();
      const text =
        data?.candidates?.[0]?.content?.parts?.[0]?.text ||
        data?.candidates?.[0]?.content?.parts?.map((p) => p.text || "").join("\n") ||
        "";

      if (text) {
        return { model, text, fallback: false };
      }
    } catch {
      // try next fallback model
    }
  }

  return {
    model: null,
    text: "Gemini request failed on all fallback models.",
    fallback: true,
    prompt,
  };
}

async function executeNode(node, input, context) {
  const data = asObject(node.data);
  const config = asObject(data.config);
  const nodeType = String(data.nodeType || node.type || "unknown").toLowerCase();

  if (
    nodeType.includes("trigger") ||
    nodeType === "webhook" ||
    nodeType === "timer" ||
    nodeType === "custominput"
  ) {
    return input;
  }

  if (nodeType === "prompttemplate" || nodeType === "text") {
    const template = config.template || data.text || data.prompt || "{{input}}";
    return {
      text: renderTemplate(template, { ...asObject(input), input }),
      input,
    };
  }

  if (nodeType === "set" || nodeType === "transform") {
    return {
      ...asObject(input),
      ...asObject(config),
    };
  }

  if (nodeType === "if" || nodeType === "filter") {
    const condition = String(config.condition || data.condition || "true");
    const passed = evaluateCondition(condition, input, context.results);
    return { passed, input, condition };
  }

  if (nodeType === "http" || nodeType === "api") {
    const method = String(config.method || data.method || "GET").toUpperCase();
    const url = String(config.url || data.url || "");

    if (!url) {
      return {
        ok: false,
        error: "HTTP/API node missing URL",
        input,
      };
    }

    const headers = {
      "Content-Type": "application/json",
      ...asObject(config.headers),
    };

    const requestBody =
      method === "GET" || method === "HEAD"
        ? undefined
        : JSON.stringify(config.body ?? input ?? {});

    const response = await fetch(url, {
      method,
      headers,
      body: requestBody,
    });

    const text = await response.text();
    let parsed = text;
    try {
      parsed = JSON.parse(text);
    } catch {
      // keep text output
    }

    return {
      ok: response.ok,
      status: response.status,
      data: parsed,
    };
  }

  if (nodeType === "code") {
    const code = String(config.code || data.code || "return input;");
    const fn = new Function(
      "input",
      "context",
      "fetch",
      `${code}\nreturn typeof result !== "undefined" ? result : input;`,
    );

    return await fn(input, context, fetch);
  }

  if (nodeType === "llm" || nodeType === "aiagent" || nodeType === "ragpipeline") {
    const prompt = buildPrompt(node, input);
    return await callGemini(prompt, context.geminiApiKey || "");
  }

  if (
    nodeType === "customoutput" ||
    nodeType === "telegrambot" ||
    nodeType === "discordbot" ||
    nodeType === "whatsappbot" ||
    nodeType === "email" ||
    nodeType === "slack"
  ) {
    return input;
  }

  return {
    nodeType,
    input,
    config,
    note: "No specialized runtime handler found. Returned passthrough payload.",
  };
}

function buildIncomingMap(edges) {
  const incoming = new Map();
  for (const edge of edges || []) {
    const list = incoming.get(edge.target) || [];
    list.push(edge.source);
    incoming.set(edge.target, list);
  }
  return incoming;
}

function getExecutionOrder(nodes, plan) {
  const planSteps = Array.isArray(plan?.steps) ? plan.steps : [];
  if (planSteps.length > 0) {
    return planSteps
      .map((step) => step.nodeId)
      .filter(Boolean);
  }
  return (nodes || []).map((node) => node.id);
}

function createNodeInput(nodeId, payload, incomingMap, results) {
  const parents = incomingMap.get(nodeId) || [];
  if (parents.length === 0) return payload;
  if (parents.length === 1) return results[parents[0]];

  const upstream = {};
  for (const parentId of parents) {
    upstream[parentId] = results[parentId];
  }
  return { payload, upstream };
}

async function runWorkflow(payload, options = {}) {
  const nodes = Array.isArray(workflow.nodes) ? workflow.nodes : [];
  const edges = Array.isArray(workflow.edges) ? workflow.edges : [];
  const plan = workflow.plan && typeof workflow.plan === "object" ? workflow.plan : {};

  const nodeById = new Map(nodes.map((node) => [node.id, node]));
  const incomingMap = buildIncomingMap(edges);
  const order = getExecutionOrder(nodes, plan);

  const results = {};
  const trace = [];

  for (const nodeId of order) {
    const node = nodeById.get(nodeId);
    if (!node) continue;

    const startedAt = Date.now();
    const nodeType = String(node?.data?.nodeType || node?.type || "unknown");

    try {
      const input = createNodeInput(nodeId, payload, incomingMap, results);
      const output = await executeNode(node, input, {
        payload,
        results,
        geminiApiKey: options.geminiApiKey || "",
      });

      results[nodeId] = output;
      trace.push({
        nodeId,
        nodeType,
        status: "success",
        durationMs: Date.now() - startedAt,
      });
    } catch (error) {
      trace.push({
        nodeId,
        nodeType,
        status: "failed",
        durationMs: Date.now() - startedAt,
        error: error instanceof Error ? error.message : "Unknown node error",
      });
      throw error;
    }
  }

  const lastNodeId = order[order.length - 1];
  const output = lastNodeId ? results[lastNodeId] : payload;

  return { output, results, trace };
}

function summarizeOutput(output) {
  if (output == null) return "No output";
  if (typeof output === "string") {
    return output.length > 180 ? `${output.slice(0, 180)}...` : output;
  }
  try {
    const text = JSON.stringify(output);
    return text.length > 180 ? `${text.slice(0, 180)}...` : text;
  } catch {
    return String(output);
  }
}

module.exports = {
  runWorkflow,
  summarizeOutput,
};
`;
}

function genBackendPackageJson(slug: string): Record<string, unknown> {
  return {
    name: `${slug}-backend`,
    version: "1.0.0",
    private: true,
    type: "commonjs",
    scripts: {
      dev: "nodemon index.js",
      start: "node index.js",
    },
    dependencies: {
      cors: "^2.8.5",
      dotenv: "^16.4.5",
      express: "^4.19.2",
    },
    devDependencies: {
      nodemon: "^3.1.4",
    },
  };
}

function addBackendScaffold(zip: JSZip, ctx: ExportContext): void {
  const backend = ensureFolder(zip, "backend");

  backend.file("index.js", genBackendServerJs(ctx.workflowName));
  backend.file("workflow-engine.js", genBackendEngineJs());
  backend.file("workflow.json", `${ctx.workflowJson}\n`);
  backend.file("package.json", asPrettyJson(genBackendPackageJson(ctx.slug)));
  backend.file(
    "Dockerfile",
    [
      "FROM node:20-alpine",
      "WORKDIR /app",
      "COPY package.json package-lock.json* ./",
      "RUN npm install",
      "COPY . .",
      "EXPOSE 8000",
      "CMD [\"npm\", \"run\", \"start\"]",
      "",
    ].join("\n"),
  );
}

function genFrontendAppJs(workflowName: string): string {
  return `import { useEffect, useMemo, useState } from "react";
import "./styles.css";

const DEFAULT_API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000";

function safeParseJson(raw) {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export default function App() {
  const [apiBase, setApiBase] = useState(DEFAULT_API_BASE);
  const [payload, setPayload] = useState('{"input":"Hello from ${workflowName}"}');
  const [workflowMeta, setWorkflowMeta] = useState(null);
  const [output, setOutput] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const canRun = useMemo(() => Boolean(apiBase.trim()), [apiBase]);

  useEffect(() => {
    const loadMeta = async () => {
      try {
        const response = await fetch(`${apiBase.replace(/\/+$/, "")}/api/workflow`);
        if (!response.ok) return;
        setWorkflowMeta(await response.json());
      } catch {
        setWorkflowMeta(null);
      }
    };

    void loadMeta();
  }, [apiBase]);

  const runWorkflow = async () => {
    setError("");
    setLoading(true);
    setOutput(null);

    const parsedPayload = safeParseJson(payload);
    if (!parsedPayload) {
      setError("Payload must be valid JSON");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${apiBase.replace(/\/+$/, "")}/api/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsedPayload),
      });
      const body = await response.json();
      if (!response.ok || body.ok === false) {
        throw new Error(body.error || "Workflow execution failed");
      }
      setOutput(body);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="app-shell">
      <header>
        <h1>${workflowName}</h1>
        <p>Generated Aura workflow client</p>
      </header>

      <section className="card">
        <label>API Base URL</label>
        <input value={apiBase} onChange={(e) => setApiBase(e.target.value)} />
      </section>

      {workflowMeta && (
        <section className="card grid">
          <Stat label="Nodes" value={workflowMeta.nodes} />
          <Stat label="Edges" value={workflowMeta.edges} />
          <Stat label="Plan Steps" value={workflowMeta.planSteps} />
        </section>
      )}

      <section className="card">
        <label>Request Payload (JSON)</label>
        <textarea value={payload} onChange={(e) => setPayload(e.target.value)} rows={8} />
        <button disabled={!canRun || loading} onClick={runWorkflow}>
          {loading ? "Running..." : "Run Workflow"}
        </button>
      </section>

      {error && <section className="card error">{error}</section>}

      {output && (
        <section className="card">
          <label>Execution Result</label>
          <pre>{JSON.stringify(output, null, 2)}</pre>
        </section>
      )}
    </main>
  );
}

function Stat({ label, value }) {
  return (
    <div className="stat">
      <span>{label}</span>
      <strong>{String(value ?? 0)}</strong>
    </div>
  );
}
`;
}

function genFrontendStylesCss(): string {
  return `:root {
  color-scheme: light;
  font-family: "Space Grotesk", "Segoe UI", sans-serif;
  background: radial-gradient(circle at 20% 10%, #dbeafe 0%, #eef2ff 35%, #f8fafc 100%);
  color: #0f172a;
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  min-height: 100vh;
}

.app-shell {
  max-width: 900px;
  margin: 0 auto;
  padding: 2rem 1rem 3rem;
}

header h1 {
  margin: 0;
  font-size: clamp(1.4rem, 3vw, 2rem);
}

header p {
  margin: 0.35rem 0 0;
  color: #334155;
}

.card {
  border: 1px solid #cbd5e1;
  background: rgba(255, 255, 255, 0.86);
  backdrop-filter: blur(4px);
  border-radius: 14px;
  padding: 1rem;
  margin-top: 1rem;
}

.card.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 0.75rem;
}

.stat {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 0.6rem 0.75rem;
}

.stat span {
  display: block;
  font-size: 0.75rem;
  color: #475569;
}

label {
  font-size: 0.85rem;
  display: block;
  margin-bottom: 0.45rem;
  color: #0f172a;
}

input,
textarea {
  width: 100%;
  border: 1px solid #94a3b8;
  border-radius: 10px;
  padding: 0.7rem;
  font-size: 0.92rem;
  font-family: "JetBrains Mono", ui-monospace, monospace;
}

textarea {
  resize: vertical;
  min-height: 120px;
}

button {
  margin-top: 0.75rem;
  border: none;
  border-radius: 999px;
  background: linear-gradient(120deg, #0ea5e9 0%, #2563eb 100%);
  color: #fff;
  font-weight: 600;
  padding: 0.6rem 1rem;
  cursor: pointer;
}

button:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

pre {
  margin: 0;
  background: #0f172a;
  color: #e2e8f0;
  border-radius: 10px;
  padding: 0.75rem;
  overflow: auto;
  font-size: 0.8rem;
}

.error {
  border-color: #ef4444;
  color: #991b1b;
  background: #fee2e2;
}
`;
}

function genFrontendPackageJson(slug: string): Record<string, unknown> {
  return {
    name: `${slug}-frontend`,
    version: "1.0.0",
    private: true,
    type: "module",
    scripts: {
      dev: "vite",
      build: "vite build",
      start: "vite --host",
      preview: "vite preview",
    },
    dependencies: {
      react: "^18.3.1",
      "react-dom": "^18.3.1",
    },
    devDependencies: {
      "@vitejs/plugin-react": "^4.3.1",
      vite: "^5.4.10",
    },
  };
}

function addFrontendScaffold(zip: JSZip, ctx: ExportContext): void {
  const frontend = ensureFolder(zip, "frontend");
  const src = ensureFolder(frontend, "src");

  src.file("App.jsx", genFrontendAppJs(ctx.workflowName));
  src.file("main.jsx", 'import React from "react";\nimport ReactDOM from "react-dom/client";\nimport App from "./App";\n\nReactDOM.createRoot(document.getElementById("root")).render(<App />);\n');
  src.file("styles.css", genFrontendStylesCss());

  frontend.file(
    "index.html",
    `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${ctx.workflowName}</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
`,
  );

  frontend.file(
    "vite.config.js",
    'import { defineConfig } from "vite";\nimport react from "@vitejs/plugin-react";\n\nexport default defineConfig({\n  plugins: [react()],\n  server: {\n    host: true,\n    port: 5173,\n    proxy: {\n      "/api": "http://localhost:8000",\n      "/webhook": "http://localhost:8000",\n      "/health": "http://localhost:8000",\n    },\n  },\n});\n',
  );

  frontend.file("package.json", asPrettyJson(genFrontendPackageJson(ctx.slug)));
  frontend.file(
    "Dockerfile",
    [
      "FROM node:20-alpine",
      "WORKDIR /app",
      "COPY package.json package-lock.json* ./",
      "RUN npm install",
      "COPY . .",
      "EXPOSE 5173",
      "CMD [\"npm\", \"run\", \"start\"]",
      "",
    ].join("\n"),
  );
}

function genTelegramBotJs(): string {
  return `require("dotenv").config();
const TelegramBot = require("node-telegram-bot-api");

const botToken = process.env.TELEGRAM_BOT_TOKEN;
const backendUrl = (process.env.BACKEND_URL || "http://localhost:8000").replace(/\/+$/, "");

if (!botToken) {
  throw new Error("Missing TELEGRAM_BOT_TOKEN in .env");
}

const bot = new TelegramBot(botToken, { polling: true });

function replyTextFromExecution(execution) {
  const output = execution?.output;
  if (typeof output === "string") return output;
  return JSON.stringify(output ?? execution, null, 2).slice(0, 3500);
}

bot.onText(/\\/start/, async (msg) => {
  await bot.sendMessage(msg.chat.id, "Aura bot ready. Send any message to run your workflow.");
});

bot.on("message", async (msg) => {
  if (!msg.text || msg.text.startsWith("/")) return;

  try {
    const response = await fetch(`${backendUrl}/api/run`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: msg.text,
        chatId: msg.chat.id,
        userId: msg.from?.id,
        username: msg.from?.username,
      }),
    });

    const body = await response.json();
    if (!response.ok || body.ok === false) {
      throw new Error(body.error || "Workflow failed");
    }

    await bot.sendMessage(msg.chat.id, replyTextFromExecution(body));
  } catch (error) {
    await bot.sendMessage(
      msg.chat.id,
      `Workflow error: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
});

console.log("[telegram-bot] Listening for messages...");
`;
}

function genDiscordBotJs(): string {
  return `require("dotenv").config();
const { Client, GatewayIntentBits } = require("discord.js");

const botToken = process.env.DISCORD_BOT_TOKEN;
const backendUrl = (process.env.BACKEND_URL || "http://localhost:8000").replace(/\/+$/, "");

if (!botToken) {
  throw new Error("Missing DISCORD_BOT_TOKEN in .env");
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages,
  ],
});

function replyTextFromExecution(execution) {
  const output = execution?.output;
  if (typeof output === "string") return output;
  return JSON.stringify(output ?? execution, null, 2).slice(0, 1800);
}

client.on("ready", () => {
  console.log(`[discord-bot] Logged in as ${client.user?.tag || "bot"}`);
});

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  try {
    const response = await fetch(`${backendUrl}/api/run`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: message.content,
        channelId: message.channelId,
        authorId: message.author.id,
        username: message.author.username,
      }),
    });

    const body = await response.json();
    if (!response.ok || body.ok === false) {
      throw new Error(body.error || "Workflow failed");
    }

    await message.reply(replyTextFromExecution(body));
  } catch (error) {
    await message.reply(
      `Workflow error: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
});

void client.login(botToken);
`;
}

function genWhatsAppBotJs(): string {
  return `require("dotenv").config();
const express = require("express");
const twilio = require("twilio");

const app = express();
const backendUrl = (process.env.BACKEND_URL || "http://localhost:8000").replace(/\/+$/, "");
const botPort = Number(process.env.BOT_PORT || 3100);

app.use(express.urlencoded({ extended: false }));

function replyTextFromExecution(execution) {
  const output = execution?.output;
  if (typeof output === "string") return output;
  return JSON.stringify(output ?? execution, null, 2).slice(0, 1500);
}

app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "whatsapp-bot" });
});

app.post("/twilio/webhook", async (req, res) => {
  const incomingText = req.body.Body || "";
  const sender = req.body.From || "unknown";

  const twiml = new twilio.twiml.MessagingResponse();

  try {
    const response = await fetch(`${backendUrl}/api/run`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: incomingText,
        from: sender,
      }),
    });

    const body = await response.json();
    if (!response.ok || body.ok === false) {
      throw new Error(body.error || "Workflow failed");
    }

    twiml.message(replyTextFromExecution(body));
  } catch (error) {
    twiml.message(
      `Workflow error: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }

  res.type("text/xml").send(twiml.toString());
});

app.listen(botPort, () => {
  console.log(`[whatsapp-bot] listening on http://localhost:${botPort}`);
  console.log("Configure your Twilio WhatsApp webhook URL to /twilio/webhook");
});
`;
}

function genBotPackageJson(
  projectType: ExportProjectType,
  slug: string,
): Record<string, unknown> {
  const deps: Record<string, string> = {
    dotenv: "^16.4.5",
  };

  if (projectType === "telegram-bot") {
    deps["node-telegram-bot-api"] = "^0.66.0";
  }
  if (projectType === "discord-bot") {
    deps["discord.js"] = "^14.17.3";
  }
  if (projectType === "whatsapp-bot") {
    deps.express = "^4.19.2";
    deps.twilio = "^5.4.2";
  }

  return {
    name: `${slug}-bot`,
    version: "1.0.0",
    private: true,
    type: "commonjs",
    scripts: {
      dev: "node index.js",
      start: "node index.js",
    },
    dependencies: deps,
  };
}

function addBotScaffold(zip: JSZip, ctx: ExportContext): void {
  if (!["telegram-bot", "discord-bot", "whatsapp-bot"].includes(ctx.projectType)) {
    return;
  }

  const bot = ensureFolder(zip, "bot");

  const botEntry =
    ctx.projectType === "telegram-bot"
      ? genTelegramBotJs()
      : ctx.projectType === "discord-bot"
        ? genDiscordBotJs()
        : genWhatsAppBotJs();

  bot.file("index.js", botEntry);
  bot.file("package.json", asPrettyJson(genBotPackageJson(ctx.projectType, ctx.slug)));
  bot.file(
    "Dockerfile",
    [
      "FROM node:20-alpine",
      "WORKDIR /app",
      "COPY package.json package-lock.json* ./",
      "RUN npm install",
      "COPY . .",
      "CMD [\"npm\", \"run\", \"start\"]",
      "",
    ].join("\n"),
  );
}

function genBotCompose(projectType: ExportProjectType): string {
  const botServiceName =
    projectType === "telegram-bot"
      ? "telegram-bot"
      : projectType === "discord-bot"
        ? "discord-bot"
        : "whatsapp-bot";

  const extraPorts =
    projectType === "whatsapp-bot"
      ? ["      - \"3100:3100\""]
      : [];

  return `services:
  backend:
    build:
      context: ./backend
    env_file:
      - .env
    ports:
      - "8000:8000"

  ${botServiceName}:
    build:
      context: ./bot
    env_file:
      - .env
    depends_on:
      - backend
${extraPorts.join("\n")}
`;
}

function genFullstackCompose(): string {
  return `services:
  backend:
    build:
      context: ./backend
    env_file:
      - .env
    ports:
      - "8000:8000"

  frontend:
    build:
      context: ./frontend
    env_file:
      - .env
    depends_on:
      - backend
    ports:
      - "5173:5173"
`;
}

function addWordPressPlugin(zip: JSZip, ctx: ExportContext): void {
  const pluginRoot = ensureFolder(zip, "wordpress-plugin");
  const pluginSlug = `${ctx.slug}-aura-bridge`;
  const pluginDir = ensureFolder(pluginRoot, pluginSlug);

  pluginDir.file(
    `${pluginSlug}.php`,
    `<?php
/**
 * Plugin Name: Aura Workflow Bridge
 * Description: Connect WordPress forms/actions to an Aura workflow backend.
 * Version: 1.0.0
 * Author: Aura Engine
 */

if (!defined('ABSPATH')) {
  exit;
}

class Aura_Workflow_Bridge {
  const OPTION_ENDPOINT = 'aura_workflow_endpoint';
  const OPTION_API_KEY = 'aura_workflow_api_key';

  public function __construct() {
    add_action('admin_menu', [$this, 'register_admin_menu']);
    add_action('admin_init', [$this, 'register_settings']);
    add_action('rest_api_init', [$this, 'register_rest_routes']);
    add_shortcode('aura_workflow_form', [$this, 'render_form_shortcode']);
  }

  public function register_admin_menu() {
    add_options_page(
      'Aura Workflow Bridge',
      'Aura Workflow',
      'manage_options',
      'aura-workflow-bridge',
      [$this, 'render_settings_page']
    );
  }

  public function register_settings() {
    register_setting('aura_workflow_group', self::OPTION_ENDPOINT);
    register_setting('aura_workflow_group', self::OPTION_API_KEY);
  }

  public function register_rest_routes() {
    register_rest_route('aura-workflow/v1', '/run', [
      'methods' => 'POST',
      'callback' => [$this, 'run_workflow'],
      'permission_callback' => '__return_true',
    ]);
  }

  public function run_workflow($request) {
    $endpoint = get_option(self::OPTION_ENDPOINT, 'http://localhost:8000/api/run');
    $api_key = get_option(self::OPTION_API_KEY, '');

    if (empty($endpoint)) {
      return new WP_Error('aura_missing_endpoint', 'Workflow endpoint is not configured.', ['status' => 500]);
    }

    $headers = [
      'Content-Type' => 'application/json',
    ];

    if (!empty($api_key)) {
      $headers['Authorization'] = 'Bearer ' . $api_key;
    }

    $payload = $request->get_json_params();
    if (empty($payload)) {
      $payload = $request->get_params();
    }

    $response = wp_remote_post($endpoint, [
      'headers' => $headers,
      'body' => wp_json_encode($payload),
      'timeout' => 20,
    ]);

    if (is_wp_error($response)) {
      return new WP_Error('aura_request_failed', $response->get_error_message(), ['status' => 500]);
    }

    $status = wp_remote_retrieve_response_code($response);
    $body = wp_remote_retrieve_body($response);
    $decoded = json_decode($body, true);

    if ($status >= 400) {
      return new WP_Error('aura_backend_error', 'Backend returned error', [
        'status' => $status,
        'body' => $decoded ?: $body,
      ]);
    }

    return rest_ensure_response($decoded ?: ['raw' => $body]);
  }

  public function render_settings_page() {
    ?>
    <div class="wrap">
      <h1>Aura Workflow Bridge</h1>
      <form method="post" action="options.php">
        <?php settings_fields('aura_workflow_group'); ?>
        <table class="form-table" role="presentation">
          <tr>
            <th scope="row">Backend Endpoint</th>
            <td>
              <input type="url" name="<?php echo esc_attr(self::OPTION_ENDPOINT); ?>" value="<?php echo esc_attr(get_option(self::OPTION_ENDPOINT, 'http://localhost:8000/api/run')); ?>" class="regular-text" />
              <p class="description">Example: https://api.example.com/api/run</p>
            </td>
          </tr>
          <tr>
            <th scope="row">API Key (optional)</th>
            <td>
              <input type="text" name="<?php echo esc_attr(self::OPTION_API_KEY); ?>" value="<?php echo esc_attr(get_option(self::OPTION_API_KEY, '')); ?>" class="regular-text" />
            </td>
          </tr>
        </table>
        <?php submit_button('Save Settings'); ?>
      </form>
      <hr />
      <p>REST endpoint: <code>/wp-json/aura-workflow/v1/run</code></p>
      <p>Shortcode: <code>[aura_workflow_form]</code></p>
    </div>
    <?php
  }

  public function render_form_shortcode() {
    ob_start();
    ?>
    <form class="aura-workflow-form" onsubmit="return false;">
      <label>Message</label><br />
      <textarea id="aura-workflow-message" rows="4" style="width:100%;max-width:560px;"></textarea><br />
      <button type="button" onclick="window.auraRunWorkflow()">Run Workflow</button>
      <pre id="aura-workflow-output" style="margin-top:12px;background:#111;color:#eee;padding:10px;border-radius:8px;max-width:560px;overflow:auto;"></pre>
    </form>
    <script>
      window.auraRunWorkflow = async function () {
        const messageEl = document.getElementById('aura-workflow-message');
        const outputEl = document.getElementById('aura-workflow-output');
        outputEl.textContent = 'Running...';

        try {
          const res = await fetch('<?php echo esc_url(rest_url('aura-workflow/v1/run')); ?>', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: messageEl.value || '' })
          });
          const body = await res.json();
          outputEl.textContent = JSON.stringify(body, null, 2);
        } catch (err) {
          outputEl.textContent = String(err);
        }
      }
    </script>
    <?php
    return ob_get_clean();
  }
}

new Aura_Workflow_Bridge();
`,
  );

  pluginDir.file(
    "readme.txt",
    `=== Aura Workflow Bridge ===
Contributors: aura
Tags: ai, automation, workflow, webhook
Requires at least: 6.0
Tested up to: 6.8
Stable tag: 1.0.0
License: GPLv2 or later

Aura Workflow Bridge connects WordPress pages/forms to your Aura backend workflow API.

== Installation ==
1. Upload this plugin folder to /wp-content/plugins/
2. Activate "Aura Workflow Bridge"
3. Open Settings > Aura Workflow
4. Configure backend endpoint

== Usage ==
Use shortcode [aura_workflow_form] to render a test input form.
Send custom payloads to /wp-json/aura-workflow/v1/run.
`,
  );

  pluginRoot.file(
    "README.md",
    `# WordPress Bridge

This folder contains a deployable WordPress plugin generated from **${ctx.workflowName}**.

## Install
1. Zip the folder \`${pluginSlug}\`.
2. Upload in WordPress Admin -> Plugins -> Add New -> Upload Plugin.
3. Set backend endpoint in Settings -> Aura Workflow.

## Runtime flow
WordPress -> Aura Workflow Bridge REST route -> Backend /api/run -> Workflow response
`,
  );
}

function addSharedMetadata(zip: JSZip, ctx: ExportContext): void {
  const shared = ensureFolder(zip, "shared");
  shared.file(
    "workflow-summary.json",
    asPrettyJson({
      name: ctx.workflowName,
      projectType: ctx.projectType,
      nodeCount: ctx.nodeCount,
      edgeCount: ctx.edgeCount,
      generatedAt: new Date().toISOString(),
    }),
  );
}

function shouldIncludeBackend(projectType: ExportProjectType): boolean {
  return projectType !== "react-spa";
}

function shouldIncludeFrontend(projectType: ExportProjectType): boolean {
  return projectType === "react-spa" || projectType === "fullstack-docker";
}

function shouldIncludeBot(projectType: ExportProjectType): boolean {
  return ["telegram-bot", "discord-bot", "whatsapp-bot"].includes(projectType);
}

function shouldIncludeDockerCompose(projectType: ExportProjectType): boolean {
  return (
    projectType === "fullstack-docker" ||
    projectType === "telegram-bot" ||
    projectType === "discord-bot" ||
    projectType === "whatsapp-bot"
  );
}

export async function exportProjectZip(
  nodes: PipelineNode[],
  edges: PipelineEdge[],
  projectType: ExportProjectType,
  workflowName = "Aura Workflow",
): Promise<void> {
  const zip = new JSZip();
  const { plan, hasCycle, orphanedNodes } = compileGraph(nodes, edges);
  const slug = slugify(workflowName);

  const workflowPayload = {
    name: workflowName,
    generatedAt: new Date().toISOString(),
    projectType,
    nodes,
    edges,
    plan,
    compiler: {
      hasCycle,
      orphanedNodes,
    },
  };

  const ctx: ExportContext = {
    workflowName,
    projectType,
    slug,
    workflowJson: JSON.stringify(workflowPayload, null, 2),
    masterPrompt: generateMasterPrompt(nodes, edges, workflowName),
    envVars: collectEnvVars(nodes, projectType),
    nodeCount: nodes.length,
    edgeCount: edges.length,
  };

  zip.file("README.md", genRootReadme(ctx));
  zip.file("package.json", asPrettyJson(genRootPackageJson(ctx)));
  zip.file(".env.template", genEnvTemplate(ctx));
  zip.file(".gitignore", `${genGitignore()}\n`);
  zip.file("workflow.json", `${ctx.workflowJson}\n`);
  zip.file("master-prompt.txt", `${ctx.masterPrompt}\n`);

  if (shouldIncludeBackend(projectType)) {
    addBackendScaffold(zip, ctx);
  }

  if (shouldIncludeFrontend(projectType)) {
    addFrontendScaffold(zip, ctx);
  }

  if (shouldIncludeBot(projectType)) {
    addBotScaffold(zip, ctx);
  }

  if (projectType === "wordpress-plugin") {
    addWordPressPlugin(zip, ctx);
  }

  if (shouldIncludeDockerCompose(projectType)) {
    const composeContent =
      projectType === "fullstack-docker"
        ? genFullstackCompose()
        : genBotCompose(projectType);
    zip.file("docker-compose.yml", `${composeContent}\n`);
  }

  addSharedMetadata(zip, ctx);

  const blob = await zip.generateAsync({
    type: "blob",
    compression: "DEFLATE",
    compressionOptions: { level: 9 },
  });

  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${slug}-aura-export.zip`;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}
