/**
 * Prompt-to-Canvas Service — converts a master prompt into a structured
 * workflow JSON (nodes + edges) via Gemini AI, then returns it ready
 * to be applied to the React Flow canvas.
 */

import type { Content } from "@google/genai";
import { NODE_DEFINITIONS } from "../nodes/definitions";
import type { PipelineEdge, PipelineNode } from "../types";
import { autoLayoutDagre } from "./graphCompiler";
import {
  GEMINI_MODEL_FALLBACKS,
  getGoogleGenAI,
  hasGeminiApiKey,
} from "./googleGenAI";

const GEMINI_MODELS = GEMINI_MODEL_FALLBACKS;

// ── Available node types for the AI ──────────────────────────────────────────
const AVAILABLE_TYPES = NODE_DEFINITIONS.map(
  (d) => `${d.type} (${d.label}): ${d.description ?? ""}`,
).join("\n");

// ── System prompt for workflow generation ─────────────────────────────────────
const WORKFLOW_SYSTEM_PROMPT = `You are an expert AI workflow architect. Your job is to convert user descriptions into valid workflow JSON for the Aura Engine visual orchestrator.

AVAILABLE NODE TYPES:
${AVAILABLE_TYPES}

OUTPUT FORMAT: Respond ONLY with a valid JSON object. No markdown, no backticks, no explanation. Structure:
{
  "nodes": [
    {
      "id": "node-1",
      "type": "nodeType",
      "data": {
        "label": "Human-readable label",
        "nodeType": "nodeType",
        "config": {}
      },
      "position": { "x": 0, "y": 0 }
    }
  ],
  "edges": [
    {
      "id": "edge-1",
      "source": "node-1",
      "target": "node-2",
      "type": "smoothstep"
    }
  ]
}

RULES:
1. Every workflow must start with a trigger node (webhook/timer/customInput/telegramTrigger/etc.)
2. Every workflow must end with an output node or a messaging node (customOutput/telegramBot/etc.)
3. Use realistic node labels that describe the purpose (e.g., "Parse User Input", "Generate Summary")
4. Position nodes left-to-right. Triggers at x:0, outputs at x:800+. Space nodes 250px apart.
5. Only use node types from the AVAILABLE NODE TYPES list above.
6. Create meaningful edges that show data flow.
7. For AI workflows, always include an LLM or aiAgent node.
8. Respond ONLY with valid JSON — no explanation, no markdown fencing.`;

// ── Template-based fallback engine ────────────────────────────────────────────
// Used when Gemini is unavailable or returns an empty/invalid response.

interface NodeTemplate {
  type: string;
  label: string;
  config?: Record<string, unknown>;
}

interface WorkflowTemplate {
  name: string;
  keywords: string[];
  chain: NodeTemplate[];
}

const WORKFLOW_TEMPLATES: WorkflowTemplate[] = [
  {
    name: "Telegram AI Bot",
    keywords: ["telegram", "telegrambot", "telegram bot"],
    chain: [
      { type: "telegramTrigger", label: "Telegram Trigger" },
      {
        type: "promptTemplate",
        label: "Format Prompt",
        config: { template: "User said: {{input.text}}\n\nReply helpfully." },
      },
      {
        type: "llm",
        label: "Generate Reply",
        config: { provider: "openai", model: "gpt-4o-mini" },
      },
      { type: "telegramBot", label: "Send Telegram Reply" },
    ],
  },
  {
    name: "WhatsApp AI Bot",
    keywords: ["whatsapp", "whatsapp bot"],
    chain: [
      { type: "whatsappTrigger", label: "WhatsApp Trigger" },
      {
        type: "llm",
        label: "Generate Reply",
        config: { provider: "openai", model: "gpt-4o-mini" },
      },
      { type: "whatsappBot", label: "Send WhatsApp Reply" },
    ],
  },
  {
    name: "Discord AI Bot",
    keywords: ["discord", "discord bot"],
    chain: [
      { type: "discordTrigger", label: "Discord Message" },
      {
        type: "llm",
        label: "Generate Reply",
        config: { provider: "openai", model: "gpt-4o-mini" },
      },
      { type: "discordBot", label: "Send Discord Reply" },
    ],
  },
  {
    name: "RAG / Knowledge Base QA",
    keywords: [
      "rag",
      "knowledge base",
      "knowledge",
      "qa",
      "q&a",
      "retrieval",
      "document qa",
      "pdf qa",
      "search docs",
    ],
    chain: [
      { type: "customInput", label: "User Question" },
      {
        type: "document",
        label: "Load Documents",
        config: { sourceType: "url", chunkSize: 500, overlap: 50 },
      },
      {
        type: "embedding",
        label: "Embed Chunks",
        config: { provider: "openai", model: "text-embedding-3-small" },
      },
      {
        type: "vectorStore",
        label: "Store Vectors",
        config: { provider: "pinecone", operation: "upsert" },
      },
      { type: "retriever", label: "Retrieve Context", config: { topK: 5 } },
      {
        type: "ragPipeline",
        label: "RAG Answer",
        config: { model: "gpt-4o-mini" },
      },
      { type: "customOutput", label: "Answer Output" },
    ],
  },
  {
    name: "Scheduled Data Pipeline",
    keywords: [
      "schedule",
      "cron",
      "daily",
      "hourly",
      "weekly",
      "timer",
      "every day",
      "every hour",
      "recurring",
    ],
    chain: [
      {
        type: "timer",
        label: "Scheduled Trigger",
        config: { cron: "0 9 * * 1-5", timezone: "UTC" },
      },
      { type: "http", label: "Fetch Data", config: { method: "GET" } },
      { type: "set", label: "Transform Data" },
      { type: "customOutput", label: "Pipeline Output" },
    ],
  },
  {
    name: "Webhook Data Processor",
    keywords: ["webhook", "http post", "api webhook", "receive data"],
    chain: [
      {
        type: "webhook",
        label: "Receive Webhook",
        config: { method: "POST", path: "/webhook" },
      },
      { type: "set", label: "Extract Fields" },
      {
        type: "if",
        label: "Validate Payload",
        config: { condition: "input.status === 'ok'" },
      },
      { type: "customOutput", label: "Process Result" },
    ],
  },
  {
    name: "Email Newsletter / Summary",
    keywords: [
      "email",
      "newsletter",
      "send email",
      "email summary",
      "daily email",
    ],
    chain: [
      {
        type: "timer",
        label: "Daily Trigger",
        config: { cron: "0 8 * * 1-5" },
      },
      { type: "http", label: "Fetch Content", config: { method: "GET" } },
      {
        type: "llm",
        label: "Summarize Content",
        config: {
          provider: "openai",
          model: "gpt-4o-mini",
          systemPrompt: "Summarize the content concisely in bullet points.",
        },
      },
      { type: "email", label: "Send Email Summary" },
    ],
  },
  {
    name: "Slack Notification Bot",
    keywords: ["slack", "slack notification", "slack alert", "notify slack"],
    chain: [
      { type: "webhook", label: "Event Trigger" },
      {
        type: "promptTemplate",
        label: "Format Message",
        config: {
          template: "🚨 Alert: {{input.event}}\nDetails: {{input.details}}",
        },
      },
      { type: "slack", label: "Post to Slack" },
    ],
  },
  {
    name: "AI Text Summarizer",
    keywords: [
      "summarize",
      "summary",
      "summarization",
      "tldr",
      "condense",
      "digest",
    ],
    chain: [
      { type: "customInput", label: "Text Input" },
      {
        type: "promptTemplate",
        label: "Summarize Prompt",
        config: {
          template:
            "Summarize the following in 3-5 bullet points:\n\n{{input.text}}",
        },
      },
      {
        type: "llm",
        label: "Summarize",
        config: { provider: "openai", model: "gpt-4o-mini", temperature: 0.3 },
      },
      { type: "customOutput", label: "Summary Output" },
    ],
  },
  {
    name: "AI Content Classifier",
    keywords: [
      "classify",
      "classification",
      "categorize",
      "label",
      "sentiment",
      "detect",
    ],
    chain: [
      { type: "customInput", label: "Content Input" },
      {
        type: "llm",
        label: "Classify Content",
        config: {
          provider: "openai",
          model: "gpt-4o-mini",
          systemPrompt:
            "Classify the input. Return a JSON object with: { category, confidence, reason }",
        },
      },
      {
        type: "if",
        label: "Route by Category",
        config: { condition: "input.confidence > 0.8" },
      },
      { type: "customOutput", label: "Classification Result" },
    ],
  },
  {
    name: "AI Agent with Tools",
    keywords: [
      "agent",
      "agentic",
      "autonomous",
      "tool use",
      "function calling",
      "ai agent",
    ],
    chain: [
      { type: "customInput", label: "Goal Input" },
      {
        type: "aiAgent",
        label: "AI Agent",
        config: {
          model: "gpt-4o",
          tools: '["web_search","calculator","code_interpreter"]',
          maxIterations: 5,
        },
      },
      { type: "customOutput", label: "Agent Result" },
    ],
  },
  {
    name: "HTTP API Integration",
    keywords: [
      "api",
      "rest",
      "fetch",
      "request",
      "integrate",
      "call api",
      "http",
    ],
    chain: [
      { type: "webhook", label: "Incoming Request" },
      { type: "http", label: "Call External API", config: { method: "POST" } },
      { type: "set", label: "Map Response" },
      { type: "customOutput", label: "API Response" },
    ],
  },
  {
    name: "Data Transform Pipeline",
    keywords: [
      "transform",
      "etl",
      "convert",
      "format",
      "parse",
      "process data",
      "pipeline",
    ],
    chain: [
      { type: "customInput", label: "Raw Input" },
      {
        type: "code",
        label: "Transform Data",
        config: { code: "// Transform input\nreturn { result: input };" },
      },
      { type: "set", label: "Set Output Fields" },
      { type: "customOutput", label: "Transformed Output" },
    ],
  },
  {
    name: "Loop Processor",
    keywords: [
      "loop",
      "iterate",
      "batch",
      "for each",
      "map over",
      "process list",
    ],
    chain: [
      { type: "customInput", label: "List Input" },
      {
        type: "loop",
        label: "Iterate Items",
        config: { itemsPath: "input.items", batchSize: 10 },
      },
      {
        type: "llm",
        label: "Process Item",
        config: { provider: "openai", model: "gpt-4o-mini" },
      },
      { type: "customOutput", label: "Processed Results" },
    ],
  },
];

// Default template when no keywords match
const DEFAULT_TEMPLATE: WorkflowTemplate = {
  name: "General AI Workflow",
  keywords: [],
  chain: [
    { type: "customInput", label: "User Input" },
    {
      type: "promptTemplate",
      label: "Build Prompt",
      config: { template: "{{input.text}}" },
    },
    {
      type: "llm",
      label: "AI Processing",
      config: { provider: "openai", model: "gpt-4o-mini", temperature: 0.7 },
    },
    { type: "customOutput", label: "AI Output" },
  ],
};

function matchTemplate(prompt: string): WorkflowTemplate {
  const lower = prompt.toLowerCase();
  let bestMatch: WorkflowTemplate | null = null;
  let bestScore = 0;

  for (const tpl of WORKFLOW_TEMPLATES) {
    let score = 0;
    for (const kw of tpl.keywords) {
      if (lower.includes(kw)) score += kw.split(" ").length; // longer phrase = higher score
    }
    if (score > bestScore) {
      bestScore = score;
      bestMatch = tpl;
    }
  }

  return bestMatch ?? DEFAULT_TEMPLATE;
}

export function buildTemplateWorkflow(prompt: string): {
  nodes: PipelineNode[];
  edges: PipelineEdge[];
  rawJson: string;
} {
  const template = matchTemplate(prompt);
  const nodes: PipelineNode[] = template.chain.map((t, i) => ({
    id: `node-${i + 1}`,
    type: t.type,
    position: { x: i * 280, y: 100 },
    data: {
      id: `node-${i + 1}`,
      nodeType: t.type,
      label: t.label,
      config: t.config ?? {},
    },
  }));

  const edges: PipelineEdge[] = template.chain.slice(0, -1).map((_, i) => ({
    id: `edge-${i + 1}`,
    source: `node-${i + 1}`,
    target: `node-${i + 2}`,
    type: "smoothstep" as const,
    animated: false,
    data: { edgeColor: "#6366f1" },
  }));

  const layoutedNodes = autoLayoutDagre(nodes, edges, {
    nodeWidth: 240,
    nodeHeight: 100,
    rankdir: "LR",
  });
  const rawJson = JSON.stringify({ nodes, edges }, null, 2);

  return { nodes: layoutedNodes, edges, rawJson };
}

export interface ParsedWorkflowResult {
  nodes: PipelineNode[];
  edges: PipelineEdge[];
  rawJson: string;
}

// ── Generate workflow JSON ─────────────────────────────────────────────────────
export async function generateWorkflowFromPrompt(
  userPrompt: string,
  chatHistory: Array<{ role: "user" | "model"; text: string }> = [],
): Promise<ParsedWorkflowResult> {
  // If no API key, fall straight to template engine
  if (!hasGeminiApiKey()) {
    console.warn(
      "[promptToCanvas] No Gemini key — using template fallback engine",
    );
    return buildTemplateWorkflow(userPrompt);
  }

  const ai = getGoogleGenAI();
  if (!ai) return buildTemplateWorkflow(userPrompt);

  const contents: Content[] = [
    ...chatHistory.map((m) => ({
      role: m.role,
      parts: [{ text: m.text }],
    })),
    {
      role: "user",
      parts: [
        {
          text: `Create a complete workflow for: ${userPrompt}\n\nRespond with ONLY the JSON object.`,
        },
      ],
    },
  ];

  let rawText = "";

  // Try primary model first, then fallbacks.
  for (const model of GEMINI_MODELS) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents,
        config: {
          systemInstruction: WORKFLOW_SYSTEM_PROMPT,
          temperature: 0.3,
          maxOutputTokens: 4096,
          responseMimeType: "application/json",
        },
      });

      rawText = response.text ?? "";
      if (rawText.trim()) break;
    } catch {
      continue;
    }
  }

  // AI failed or returned empty — use template fallback engine
  if (!rawText) {
    console.warn(
      "[promptToCanvas] AI returned empty response — using template fallback engine",
    );
    return buildTemplateWorkflow(userPrompt);
  }

  try {
    return parseWorkflowJson(rawText);
  } catch {
    // JSON parse failed — fall back to templates rather than crashing
    console.warn(
      "[promptToCanvas] JSON parse failed — using template fallback engine",
    );
    return buildTemplateWorkflow(userPrompt);
  }
}

// ── Parse and validate AI JSON ────────────────────────────────────────────────
export function parseWorkflowJson(raw: string): ParsedWorkflowResult {
  // Extract JSON from markdown fences if present
  const jsonMatch =
    raw.match(/```(?:json)?\s*([\s\S]*?)\s*```/) ?? raw.match(/(\{[\s\S]*\})/);
  const jsonStr = jsonMatch?.[1] ?? raw.trim();

  let parsed: { nodes: unknown[]; edges: unknown[] };
  try {
    parsed = JSON.parse(jsonStr);
  } catch {
    throw new Error("Could not parse AI response as JSON");
  }

  if (!Array.isArray(parsed.nodes) || !Array.isArray(parsed.edges)) {
    throw new Error("AI response missing nodes or edges arrays");
  }

  // Normalize nodes
  const nodes: PipelineNode[] = parsed.nodes.map((n: unknown, i: number) => {
    const node = n as Record<string, unknown>;
    const id = String(node.id ?? `node-${i + 1}`);
    const type = String(
      (node as Record<string, unknown>).type ?? "customInput",
    );
    const data = (node.data as Record<string, unknown>) ?? {};
    return {
      id,
      type,
      position: (node.position as { x: number; y: number }) ?? {
        x: i * 250,
        y: 100,
      },
      data: {
        id,
        nodeType: String(data.nodeType ?? type),
        label: String(data.label ?? type),
        config: (data.config as Record<string, unknown>) ?? {},
        ...data,
      },
    } as PipelineNode;
  });

  // Normalize edges
  const edges: PipelineEdge[] = parsed.edges.map((e: unknown, i: number) => {
    const edge = e as Record<string, unknown>;
    return {
      id: String(edge.id ?? `edge-${i + 1}`),
      source: String(edge.source ?? ""),
      target: String(edge.target ?? ""),
      type: "smoothstep",
      animated: false,
      data: { edgeColor: "#6366f1" },
    } as PipelineEdge;
  });

  // Auto-layout using dagre
  const layoutedNodes = autoLayoutDagre(nodes, edges, {
    nodeWidth: 240,
    nodeHeight: 100,
    rankdir: "LR",
  });

  return { nodes: layoutedNodes, edges, rawJson: jsonStr };
}

// ── Streaming task plan generation ───────────────────────────────────────────
export async function* streamTaskPlan(
  userPrompt: string,
): AsyncGenerator<string> {
  if (!hasGeminiApiKey()) {
    // Template fallback: generate a plan from the matched template
    const template = matchTemplate(userPrompt);
    yield `📋 Template Plan: **${template.name}**\n\n`;
    const steps = template.chain
      .map((step, i) => `${i + 1}. **${step.label}** — ${step.type} node`)
      .join("\n");
    yield steps;
    yield "\n\n> ⚡ Generated by template engine (add VITE_GEMINI_KEY for AI-powered plans)";
    return;
  }

  const ai = getGoogleGenAI();
  if (!ai) {
    const template = matchTemplate(userPrompt);
    yield `📋 Template Plan: **${template.name}**\n\n`;
    const steps = template.chain
      .map((step, i) => `${i + 1}. **${step.label}** — ${step.type} node`)
      .join("\n");
    yield steps;
    return;
  }

  const planPrompt = `You are an AI workflow planning assistant. When given a user's automation goal, create a clear numbered task plan.

Format your response as a numbered list of concrete steps:
1. [Step description]
2. [Step description]
...

Keep it concise (5-10 steps max). Focus on what the workflow will DO, not technical implementation.

User Goal: ${userPrompt}`;

  for (const model of GEMINI_MODELS) {
    try {
      const stream = await ai.models.generateContentStream({
        model,
        contents: [{ role: "user", parts: [{ text: planPrompt }] }],
        config: { temperature: 0.5, maxOutputTokens: 1024 },
      });

      let streamedAny = false;
      for await (const chunk of stream) {
        const text = chunk.text ?? "";
        if (!text) continue;
        streamedAny = true;
        yield text;
      }

      if (streamedAny) return; // success, don't try fallback
    } catch {
      continue;
    }
  }

  // Gemini failed on all models — graceful template fallback.
  const template = matchTemplate(userPrompt);
  yield `📋 Template Plan: **${template.name}**\n\n`;
  const steps = template.chain
    .map((step, i) => `${i + 1}. **${step.label}** — ${step.type} node`)
    .join("\n");
  yield steps;
  yield "\n\n> ⚡ Gemini unavailable on all fallback models, used template engine.";
}
