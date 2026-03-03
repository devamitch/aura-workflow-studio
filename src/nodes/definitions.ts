import type { NodeDefinition, NodeCategory } from "../types";

// ── Full Node Definition Registry ─────────────────────────────────────────────
export const NODE_DEFINITIONS: NodeDefinition[] = [
  // ── TRIGGERS ────────────────────────────────────────────────────────────────
  {
    type: "webhook",
    label: "Webhook",
    category: "trigger",
    uiTheme: "#f59e0b",
    group: "Triggers",
    description: "HTTP trigger endpoint",
    producesOutput: true,
    consumesInput: false,
    requiredCredentials: [
      { key: "webhookSecret", label: "Webhook Secret (optional)", required: false, secret: true, placeholder: "Optional HMAC signing secret" },
    ],
    sidebarSchema: {
      fields: [
        { key: "method", label: "HTTP Method", type: "select", defaultValue: "POST", options: [{label:"POST",value:"POST"},{label:"GET",value:"GET"},{label:"PUT",value:"PUT"},{label:"DELETE",value:"DELETE"}] },
        { key: "path", label: "Path", type: "text", placeholder: "/webhook", defaultValue: "/webhook" },
        { key: "responseMode", label: "Response Mode", type: "select", defaultValue: "lastNode", options: [{label:"Last Node Result",value:"lastNode"},{label:"Immediate 200",value:"immediate"}] },
      ],
    },
  },
  {
    type: "timer",
    label: "Schedule",
    category: "trigger",
    uiTheme: "#f59e0b",
    group: "Triggers",
    description: "Cron / interval trigger",
    producesOutput: true,
    consumesInput: false,
    sidebarSchema: {
      fields: [
        { key: "cron", label: "Cron Expression", type: "text", defaultValue: "0 * * * *", placeholder: "0 * * * *" },
        { key: "timezone", label: "Timezone", type: "text", defaultValue: "UTC", placeholder: "UTC" },
        { key: "runOnce", label: "Run Once Immediately", type: "boolean", defaultValue: false },
      ],
    },
  },
  {
    type: "customInput",
    label: "Manual Input",
    category: "trigger",
    uiTheme: "#f59e0b",
    group: "Triggers",
    description: "User-provided input",
    producesOutput: true,
    consumesInput: false,
    sidebarSchema: {
      fields: [
        { key: "inputType", label: "Input Type", type: "select", defaultValue: "text", options: [{label:"Text",value:"text"},{label:"JSON",value:"json"},{label:"Number",value:"number"}] },
        { key: "defaultValue", label: "Default Value", type: "text", placeholder: "Optional default" },
      ],
    },
  },
  {
    type: "telegramTrigger",
    label: "Telegram Trigger",
    category: "trigger",
    uiTheme: "#f59e0b",
    group: "Triggers",
    description: "Trigger on Telegram message",
    producesOutput: true,
    consumesInput: false,
    requiredCredentials: [
      { key: "botToken", label: "Bot Token", required: true, secret: true, placeholder: "123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11", validator: v => /^\d+:/.test(v), validationMessage: "Must be in format 123456:ABC..." },
    ],
    sidebarSchema: {
      fields: [
        { key: "commandFilter", label: "Command Filter", type: "text", placeholder: "/start (leave empty for all messages)" },
        { key: "allowedChats", label: "Allowed Chat IDs", type: "text", placeholder: "@channel or comma-separated IDs" },
      ],
    },
  },
  {
    type: "whatsappTrigger",
    label: "WhatsApp Trigger",
    category: "trigger",
    uiTheme: "#f59e0b",
    group: "Triggers",
    description: "Trigger on WhatsApp message via Twilio",
    producesOutput: true,
    consumesInput: false,
    requiredCredentials: [
      { key: "accountSid", label: "Twilio Account SID", required: true, secret: false, placeholder: "ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" },
      { key: "authToken", label: "Twilio Auth Token", required: true, secret: true, placeholder: "Your auth token" },
      { key: "fromNumber", label: "From Number", required: true, secret: false, placeholder: "whatsapp:+14155238886" },
    ],
    sidebarSchema: { fields: [] },
  },
  {
    type: "discordTrigger",
    label: "Discord Trigger",
    category: "trigger",
    uiTheme: "#f59e0b",
    group: "Triggers",
    description: "Trigger on Discord event",
    producesOutput: true,
    consumesInput: false,
    requiredCredentials: [
      { key: "botToken", label: "Bot Token", required: true, secret: true, placeholder: "Your Discord bot token" },
    ],
    sidebarSchema: {
      fields: [
        { key: "guildId", label: "Guild/Server ID", type: "text", placeholder: "Optional — filter by guild" },
        { key: "eventType", label: "Event Type", type: "select", defaultValue: "message", options: [{label:"Message",value:"message"},{label:"Reaction Add",value:"messageReactionAdd"},{label:"Member Join",value:"guildMemberAdd"}] },
        { key: "channelFilter", label: "Channel ID Filter", type: "text", placeholder: "Optional" },
      ],
    },
  },
  {
    type: "oauthCallback",
    label: "OAuth Callback",
    category: "trigger",
    uiTheme: "#f59e0b",
    group: "Triggers",
    description: "Handle OAuth redirect callback",
    producesOutput: true,
    consumesInput: false,
    requiredCredentials: [
      { key: "stateSecret", label: "State CSRF Secret", required: false, secret: true, placeholder: "Random secret for state parameter validation" },
    ],
    sidebarSchema: {
      fields: [
        { key: "path", label: "Callback Path", type: "text", defaultValue: "/auth/callback", placeholder: "/auth/callback" },
        { key: "provider", label: "Provider", type: "text", placeholder: "google / github / custom" },
      ],
    },
  },

  // ── AI & CORE ────────────────────────────────────────────────────────────────
  {
    type: "llm",
    label: "LLM",
    category: "ai",
    uiTheme: "#10b981",
    group: "AI & Core",
    description: "AI language model call",
    producesOutput: true,
    consumesInput: true,
    requiredCredentials: [
      { key: "apiKey", label: "API Key (BYOK)", required: true, secret: true, placeholder: "sk-... / AIza... / your key" },
    ],
    sidebarSchema: {
      fields: [
        { key: "provider", label: "Provider", type: "select", defaultValue: "openai", options: [{label:"OpenAI",value:"openai"},{label:"Anthropic Claude",value:"anthropic"},{label:"Google Gemini",value:"gemini"},{label:"Mistral",value:"mistral"},{label:"Ollama (Local)",value:"ollama"}] },
        { key: "model", label: "Model", type: "text", defaultValue: "gpt-4o", placeholder: "gpt-4o / claude-sonnet-4-6 / gemini-2.5-flash" },
        { key: "systemPrompt", label: "System Prompt", type: "textarea", placeholder: "You are a helpful assistant..." },
        { key: "temperature", label: "Temperature", type: "number", defaultValue: 0.7 },
        { key: "maxTokens", label: "Max Tokens", type: "number", defaultValue: 1024 },
        { key: "streaming", label: "Enable Streaming", type: "boolean", defaultValue: false },
      ],
    },
  },
  {
    type: "aiAgent",
    label: "AI Agent",
    category: "ai",
    uiTheme: "#10b981",
    group: "AI & Core",
    description: "Tool-enabled AI agent with autonomy",
    producesOutput: true,
    consumesInput: true,
    requiredCredentials: [
      { key: "apiKey", label: "API Key", required: true, secret: true },
    ],
    sidebarSchema: {
      fields: [
        { key: "model", label: "Model", type: "text", defaultValue: "gpt-4o" },
        { key: "systemPrompt", label: "System Prompt", type: "textarea", placeholder: "You are an agent that can use tools..." },
        { key: "tools", label: "Tools (JSON array)", type: "textarea", placeholder: '["web_search","calculator","code_interpreter"]' },
        { key: "maxIterations", label: "Max Iterations", type: "number", defaultValue: 5 },
        { key: "returnIntermediateSteps", label: "Return Intermediate Steps", type: "boolean", defaultValue: false },
      ],
    },
  },
  {
    type: "promptTemplate",
    label: "Prompt Template",
    category: "ai",
    uiTheme: "#10b981",
    group: "AI & Core",
    description: "Dynamic prompt construction",
    producesOutput: true,
    consumesInput: true,
    sidebarSchema: {
      fields: [
        { key: "template", label: "Template", type: "textarea", placeholder: "Summarize the following: {{input.text}}\nIn {{input.language}} language." },
        { key: "variables", label: "Variables (JSON)", type: "textarea", placeholder: '{"language": "English"}' },
      ],
    },
  },
  {
    type: "customOutput",
    label: "Output",
    category: "ai",
    uiTheme: "#10b981",
    group: "AI & Core",
    description: "Pipeline result output",
    producesOutput: false,
    consumesInput: true,
    sidebarSchema: {
      fields: [
        { key: "outputFormat", label: "Format", type: "select", defaultValue: "text", options: [{label:"Text",value:"text"},{label:"JSON",value:"json"},{label:"Markdown",value:"markdown"},{label:"HTML",value:"html"}] },
        { key: "label", label: "Output Label", type: "text", placeholder: "Final Result" },
      ],
    },
  },

  // ── AUTH & IDENTITY ──────────────────────────────────────────────────────────
  {
    type: "googleAuth",
    label: "Google Auth",
    category: "auth",
    uiTheme: "#6366f1",
    group: "Auth & Identity",
    description: "Google OAuth 2.0",
    producesOutput: true,
    consumesInput: false,
    requiredCredentials: [
      { key: "clientId", label: "Client ID", required: true, secret: false, placeholder: "xxx.apps.googleusercontent.com" },
      { key: "clientSecret", label: "Client Secret", required: true, secret: true },
      { key: "redirectUri", label: "Redirect URI", required: true, secret: false, placeholder: "https://app.example.com/auth/google/callback" },
    ],
    sidebarSchema: {
      fields: [
        { key: "scope", label: "Scopes", type: "text", defaultValue: "openid email profile" },
        { key: "accessType", label: "Access Type", type: "select", defaultValue: "online", options: [{label:"Online",value:"online"},{label:"Offline (refresh token)",value:"offline"}] },
      ],
    },
  },
  {
    type: "githubAuth",
    label: "GitHub Auth",
    category: "auth",
    uiTheme: "#6366f1",
    group: "Auth & Identity",
    description: "GitHub OAuth integration",
    producesOutput: true,
    consumesInput: false,
    requiredCredentials: [
      { key: "clientId", label: "Client ID", required: true, secret: false },
      { key: "clientSecret", label: "Client Secret", required: true, secret: true },
      { key: "redirectUri", label: "Redirect URI", required: true, secret: false },
    ],
    sidebarSchema: {
      fields: [
        { key: "scope", label: "Scopes", type: "text", defaultValue: "user:email read:org" },
      ],
    },
  },
  {
    type: "facebookAuth",
    label: "Facebook Auth",
    category: "auth",
    uiTheme: "#6366f1",
    group: "Auth & Identity",
    description: "Facebook OAuth integration",
    producesOutput: true,
    consumesInput: false,
    requiredCredentials: [
      { key: "appId", label: "App ID", required: true, secret: false },
      { key: "appSecret", label: "App Secret", required: true, secret: true },
      { key: "redirectUri", label: "Redirect URI", required: true, secret: false },
    ],
    sidebarSchema: {
      fields: [
        { key: "scope", label: "Permissions", type: "text", defaultValue: "email public_profile" },
      ],
    },
  },
  {
    type: "customOAuth2",
    label: "Custom OAuth 2.0",
    category: "auth",
    uiTheme: "#6366f1",
    group: "Auth & Identity",
    description: "Generic OAuth 2.0 provider",
    producesOutput: true,
    consumesInput: false,
    requiredCredentials: [
      { key: "clientId", label: "Client ID", required: true, secret: false },
      { key: "clientSecret", label: "Client Secret", required: true, secret: true },
    ],
    sidebarSchema: {
      fields: [
        { key: "authUrl", label: "Authorization URL", type: "url", required: true },
        { key: "tokenUrl", label: "Token URL", type: "url", required: true },
        { key: "scope", label: "Scope", type: "text" },
        { key: "redirectUri", label: "Redirect URI", type: "url" },
      ],
    },
  },

  // ── BOTS & MESSAGING ─────────────────────────────────────────────────────────
  {
    type: "telegramBot",
    label: "Telegram Bot",
    category: "messaging",
    uiTheme: "#0ea5e9",
    group: "Bots & Messaging",
    description: "Send Telegram message",
    producesOutput: true,
    consumesInput: true,
    requiredCredentials: [
      { key: "botToken", label: "Bot Token", required: true, secret: true, placeholder: "123456:ABC-DEF..." },
    ],
    sidebarSchema: {
      fields: [
        { key: "chatId", label: "Chat ID / Username", type: "text", placeholder: "@channel or numeric ID" },
        { key: "parseMode", label: "Parse Mode", type: "select", defaultValue: "Markdown", options: [{label:"Markdown",value:"Markdown"},{label:"HTML",value:"HTML"},{label:"Plain Text",value:""}] },
        { key: "template", label: "Message Template", type: "textarea", placeholder: "Hello {{name}}!\n\n{{message}}" },
        { key: "disablePreview", label: "Disable Link Preview", type: "boolean", defaultValue: false },
      ],
    },
  },
  {
    type: "whatsappBot",
    label: "WhatsApp Bot",
    category: "messaging",
    uiTheme: "#0ea5e9",
    group: "Bots & Messaging",
    description: "Send WhatsApp message via Twilio",
    producesOutput: true,
    consumesInput: true,
    requiredCredentials: [
      { key: "accountSid", label: "Account SID", required: true, secret: false, placeholder: "ACxxxxx" },
      { key: "authToken", label: "Auth Token", required: true, secret: true },
      { key: "fromNumber", label: "From Number", required: true, secret: false, placeholder: "whatsapp:+14155238886" },
    ],
    sidebarSchema: {
      fields: [
        { key: "toNumber", label: "To Number", type: "text", placeholder: "+1234567890" },
        { key: "template", label: "Message Template", type: "textarea", placeholder: "Hello {{name}}!" },
      ],
    },
  },
  {
    type: "discordBot",
    label: "Discord Bot",
    category: "messaging",
    uiTheme: "#0ea5e9",
    group: "Bots & Messaging",
    description: "Send Discord message",
    producesOutput: true,
    consumesInput: true,
    requiredCredentials: [
      { key: "botToken", label: "Bot Token", required: true, secret: true },
    ],
    sidebarSchema: {
      fields: [
        { key: "channelId", label: "Channel ID", type: "text" },
        { key: "template", label: "Message Template", type: "textarea" },
        { key: "embedColor", label: "Embed Color (hex)", type: "text", placeholder: "#6366f1" },
      ],
    },
  },
  {
    type: "slack",
    label: "Slack",
    category: "messaging",
    uiTheme: "#0ea5e9",
    group: "Bots & Messaging",
    description: "Send Slack message",
    producesOutput: false,
    consumesInput: true,
    requiredCredentials: [
      { key: "botToken", label: "Bot Token", required: true, secret: true, placeholder: "xoxb-..." },
    ],
    sidebarSchema: {
      fields: [
        { key: "channel", label: "Channel", type: "text", placeholder: "#general" },
        { key: "template", label: "Message Template", type: "textarea", placeholder: "Hello {{team}}!" },
        { key: "username", label: "Bot Username", type: "text", placeholder: "AuraBot" },
      ],
    },
  },

  // ── INTEGRATIONS ─────────────────────────────────────────────────────────────
  {
    type: "http",
    label: "HTTP Request",
    category: "endpoint",
    uiTheme: "#f97316",
    group: "Integrations",
    description: "Call any REST API",
    producesOutput: true,
    consumesInput: true,
    requiredCredentials: [
      { key: "authToken", label: "Auth Token (optional)", required: false, secret: true, placeholder: "Bearer token or API key" },
    ],
    sidebarSchema: {
      fields: [
        { key: "method", label: "Method", type: "select", defaultValue: "GET", options: [{label:"GET",value:"GET"},{label:"POST",value:"POST"},{label:"PUT",value:"PUT"},{label:"PATCH",value:"PATCH"},{label:"DELETE",value:"DELETE"}] },
        { key: "url", label: "URL", type: "url", placeholder: "https://api.example.com/v1/resource" },
        { key: "headers", label: "Headers (JSON)", type: "textarea", placeholder: '{"Content-Type": "application/json"}' },
        { key: "body", label: "Request Body (JSON)", type: "textarea" },
        { key: "timeout", label: "Timeout (ms)", type: "number", defaultValue: 10000 },
      ],
    },
  },
  {
    type: "api",
    label: "API Request",
    category: "endpoint",
    uiTheme: "#f97316",
    group: "Integrations",
    description: "REST / GraphQL API call",
    producesOutput: true,
    consumesInput: true,
    requiredCredentials: [
      { key: "apiKey", label: "API Key", required: false, secret: true, placeholder: "Your API key (if required)" },
      { key: "bearerToken", label: "Bearer Token", required: false, secret: true, placeholder: "Bearer token (if required)" },
    ],
    sidebarSchema: {
      fields: [
        { key: "url", label: "Endpoint URL", type: "url", placeholder: "https://api.example.com/v1/resource" },
        { key: "method", label: "Method", type: "select", defaultValue: "GET", options: [{label:"GET",value:"GET"},{label:"POST",value:"POST"},{label:"PUT",value:"PUT"},{label:"PATCH",value:"PATCH"},{label:"DELETE",value:"DELETE"}] },
        { key: "headers", label: "Extra Headers (JSON)", type: "textarea", placeholder: '{"X-Custom": "value"}' },
        { key: "body", label: "Body (JSON)", type: "textarea" },
      ],
    },
  },
  {
    type: "email",
    label: "Send Email",
    category: "endpoint",
    uiTheme: "#f97316",
    group: "Integrations",
    description: "SMTP email action",
    producesOutput: false,
    consumesInput: true,
    requiredCredentials: [
      { key: "smtpHost", label: "SMTP Host", required: true, secret: false, placeholder: "smtp.gmail.com" },
      { key: "smtpPort", label: "SMTP Port", required: true, secret: false, placeholder: "587" },
      { key: "smtpUser", label: "Username / Email", required: true, secret: false },
      { key: "smtpPassword", label: "Password", required: true, secret: true },
    ],
    sidebarSchema: {
      fields: [
        { key: "from", label: "From Address", type: "text", placeholder: "noreply@yourapp.com" },
        { key: "to", label: "To", type: "text", placeholder: "{{input.email}}" },
        { key: "subject", label: "Subject", type: "text", placeholder: "Hello from Aura!" },
        { key: "body", label: "Body Template", type: "textarea", placeholder: "Hi {{name}},\n\n{{message}}" },
        { key: "html", label: "HTML Mode", type: "boolean", defaultValue: false },
      ],
    },
  },
  {
    type: "stripe",
    label: "Stripe",
    category: "endpoint",
    uiTheme: "#f97316",
    group: "Integrations",
    description: "Stripe payment integration",
    producesOutput: true,
    consumesInput: true,
    requiredCredentials: [
      { key: "secretKey", label: "Secret Key", required: true, secret: true, placeholder: "sk_live_..." },
    ],
    sidebarSchema: {
      fields: [
        { key: "action", label: "Action", type: "select", defaultValue: "create_payment_intent", options: [{label:"Create Payment Intent",value:"create_payment_intent"},{label:"Create Customer",value:"create_customer"},{label:"Retrieve Customer",value:"retrieve_customer"},{label:"Create Subscription",value:"create_subscription"}] },
        { key: "amount", label: "Amount (cents)", type: "number" },
        { key: "currency", label: "Currency", type: "text", defaultValue: "usd" },
      ],
    },
  },
  {
    type: "postgresql",
    label: "PostgreSQL",
    category: "db",
    uiTheme: "#64748b",
    group: "Integrations",
    description: "PostgreSQL database query",
    producesOutput: true,
    consumesInput: true,
    requiredCredentials: [
      { key: "connectionString", label: "Connection String", required: true, secret: true, placeholder: "postgresql://user:pass@host:5432/db" },
    ],
    sidebarSchema: {
      fields: [
        { key: "query", label: "SQL Query", type: "textarea", placeholder: "SELECT * FROM users WHERE id = $1" },
        { key: "params", label: "Parameters (JSON array)", type: "textarea", placeholder: "[1]" },
      ],
    },
  },
  {
    type: "supabase",
    label: "Supabase",
    category: "db",
    uiTheme: "#64748b",
    group: "Integrations",
    description: "Supabase database action",
    producesOutput: true,
    consumesInput: true,
    requiredCredentials: [
      { key: "url", label: "Supabase URL", required: true, secret: false, placeholder: "https://xxx.supabase.co" },
      { key: "anonKey", label: "Anon Key", required: true, secret: true },
    ],
    sidebarSchema: {
      fields: [
        { key: "table", label: "Table", type: "text" },
        { key: "operation", label: "Operation", type: "select", defaultValue: "select", options: [{label:"Select",value:"select"},{label:"Insert",value:"insert"},{label:"Update",value:"update"},{label:"Delete",value:"delete"},{label:"Upsert",value:"upsert"}] },
        { key: "filter", label: "Filter (JSON)", type: "textarea", placeholder: '{"column": "value"}' },
        { key: "data", label: "Data (JSON)", type: "textarea", placeholder: '{"name": "Alice"}' },
      ],
    },
  },
  {
    type: "firebase",
    label: "Firebase",
    category: "db",
    uiTheme: "#64748b",
    group: "Integrations",
    description: "Firebase Firestore / RTDB",
    producesOutput: true,
    consumesInput: true,
    requiredCredentials: [
      { key: "apiKey", label: "API Key", required: true, secret: true },
      { key: "projectId", label: "Project ID", required: true, secret: false },
    ],
    sidebarSchema: {
      fields: [
        { key: "collection", label: "Collection", type: "text" },
        { key: "document", label: "Document ID", type: "text" },
        { key: "operation", label: "Operation", type: "select", defaultValue: "get", options: [{label:"Get",value:"get"},{label:"Set",value:"set"},{label:"Update",value:"update"},{label:"Delete",value:"delete"},{label:"Query",value:"query"}] },
        { key: "data", label: "Data (JSON)", type: "textarea" },
      ],
    },
  },

  // ── LOGIC & FLOW ─────────────────────────────────────────────────────────────
  {
    type: "if",
    label: "IF Condition",
    category: "logic",
    uiTheme: "#3b82f6",
    group: "Logic & Flow",
    description: "Branch on condition",
    producesOutput: true,
    consumesInput: true,
    sidebarSchema: {
      fields: [
        { key: "condition", label: "Condition (JS expression)", type: "textarea", placeholder: "input.value > 10 && input.status === 'active'" },
        { key: "trueLabel", label: "True Branch Label", type: "text", defaultValue: "true" },
        { key: "falseLabel", label: "False Branch Label", type: "text", defaultValue: "false" },
      ],
    },
  },
  {
    type: "switch",
    label: "Switch / Route",
    category: "logic",
    uiTheme: "#3b82f6",
    group: "Logic & Flow",
    description: "Multi-way routing",
    producesOutput: true,
    consumesInput: true,
    sidebarSchema: {
      fields: [
        { key: "expression", label: "Switch Expression", type: "text", placeholder: "input.status" },
        { key: "cases", label: "Cases (JSON)", type: "textarea", placeholder: '[{"value":"active","label":"Active"},{"value":"inactive","label":"Inactive"}]' },
        { key: "fallthrough", label: "Enable Fallthrough", type: "boolean", defaultValue: false },
      ],
    },
  },
  {
    type: "loop",
    label: "Loop",
    category: "logic",
    uiTheme: "#3b82f6",
    group: "Logic & Flow",
    description: "Iterate over a list",
    producesOutput: true,
    consumesInput: true,
    sidebarSchema: {
      fields: [
        { key: "inputArray", label: "Input Array Path", type: "text", placeholder: "input.items" },
        { key: "itemVar", label: "Item Variable Name", type: "text", defaultValue: "item" },
        { key: "maxIterations", label: "Max Iterations", type: "number", defaultValue: 100 },
        { key: "batchSize", label: "Batch Size (0 = no batching)", type: "number", defaultValue: 0 },
      ],
    },
  },
  {
    type: "parallel",
    label: "Parallel",
    category: "logic",
    uiTheme: "#3b82f6",
    group: "Logic & Flow",
    description: "Execute branches in parallel",
    producesOutput: true,
    consumesInput: true,
    sidebarSchema: {
      fields: [
        { key: "waitForAll", label: "Wait for All Branches", type: "boolean", defaultValue: true },
        { key: "timeout", label: "Timeout (ms)", type: "number", defaultValue: 30000 },
      ],
    },
  },
  {
    type: "merge",
    label: "Merge",
    category: "logic",
    uiTheme: "#3b82f6",
    group: "Logic & Flow",
    description: "Combine multiple inputs",
    producesOutput: true,
    consumesInput: true,
    sidebarSchema: {
      fields: [
        { key: "strategy", label: "Merge Strategy", type: "select", defaultValue: "waitAll", options: [{label:"Wait All",value:"waitAll"},{label:"First One",value:"first"},{label:"Merge Objects",value:"mergeObjects"},{label:"Concat Arrays",value:"concatArrays"}] },
      ],
    },
  },
  {
    type: "filter",
    label: "Filter",
    category: "logic",
    uiTheme: "#3b82f6",
    group: "Logic & Flow",
    description: "Filter array items",
    producesOutput: true,
    consumesInput: true,
    sidebarSchema: {
      fields: [
        { key: "condition", label: "Filter Expression (JS)", type: "textarea", placeholder: "item.active === true && item.age > 18" },
      ],
    },
  },
  {
    type: "retry",
    label: "Retry",
    category: "logic",
    uiTheme: "#3b82f6",
    group: "Logic & Flow",
    description: "Retry on failure with backoff",
    producesOutput: true,
    consumesInput: true,
    sidebarSchema: {
      fields: [
        { key: "maxRetries", label: "Max Retries", type: "number", defaultValue: 3 },
        { key: "delay", label: "Initial Delay (ms)", type: "number", defaultValue: 1000 },
        { key: "backoff", label: "Backoff Strategy", type: "select", defaultValue: "exponential", options: [{label:"Exponential",value:"exponential"},{label:"Linear",value:"linear"},{label:"Fixed",value:"fixed"}] },
        { key: "onFailure", label: "On Final Failure", type: "select", defaultValue: "throw", options: [{label:"Throw Error",value:"throw"},{label:"Return Null",value:"null"},{label:"Return Empty",value:"empty"}] },
      ],
    },
  },
  {
    type: "delay",
    label: "Delay",
    category: "logic",
    uiTheme: "#3b82f6",
    group: "Logic & Flow",
    description: "Wait for specified time",
    producesOutput: true,
    consumesInput: true,
    sidebarSchema: {
      fields: [
        { key: "duration", label: "Duration (ms)", type: "number", defaultValue: 1000 },
        { key: "jitter", label: "Jitter (%)", type: "number", defaultValue: 0 },
      ],
    },
  },
  {
    type: "rateLimit",
    label: "Rate Limit",
    category: "logic",
    uiTheme: "#3b82f6",
    group: "Logic & Flow",
    description: "Rate limit throughput",
    producesOutput: true,
    consumesInput: true,
    sidebarSchema: {
      fields: [
        { key: "maxRequests", label: "Max Requests", type: "number", defaultValue: 10 },
        { key: "windowMs", label: "Time Window (ms)", type: "number", defaultValue: 60000 },
        { key: "strategy", label: "Overflow Strategy", type: "select", defaultValue: "queue", options: [{label:"Queue",value:"queue"},{label:"Drop",value:"drop"},{label:"Error",value:"error"}] },
      ],
    },
  },

  // ── DATA & TRANSFORM ─────────────────────────────────────────────────────────
  {
    type: "set",
    label: "Set Variable",
    category: "transform",
    uiTheme: "#8b5cf6",
    group: "Data & Transform",
    description: "Assign values to variables",
    producesOutput: true,
    consumesInput: true,
    sidebarSchema: {
      fields: [
        { key: "assignments", label: "Assignments (JSON)", type: "textarea", placeholder: '{"key": "value", "computed": "{{input.field}}"}' },
        { key: "keepAll", label: "Keep All Input Fields", type: "boolean", defaultValue: true },
      ],
    },
  },
  {
    type: "code",
    label: "Code Function",
    category: "transform",
    uiTheme: "#8b5cf6",
    group: "Data & Transform",
    description: "Run custom JavaScript (sandboxed)",
    producesOutput: true,
    consumesInput: true,
    sidebarSchema: {
      fields: [
        { key: "code", label: "JavaScript Code", type: "textarea", placeholder: "// 'input' is available\n// return the new output\nreturn { result: input.value * 2 };" },
        { key: "timeout", label: "Timeout (ms)", type: "number", defaultValue: 5000 },
      ],
    },
  },
  {
    type: "text",
    label: "Prompt Template",
    category: "transform",
    uiTheme: "#8b5cf6",
    group: "Data & Transform",
    description: "Static text / template",
    producesOutput: true,
    consumesInput: false,
    sidebarSchema: {
      fields: [
        { key: "content", label: "Template", type: "textarea", placeholder: "Hello {{name}}! Your score is {{score}}." },
        { key: "trim", label: "Trim Whitespace", type: "boolean", defaultValue: true },
      ],
    },
  },
  {
    type: "note",
    label: "Note",
    category: "transform",
    uiTheme: "#8b5cf6",
    group: "Data & Transform",
    description: "Documentation note (no data flow)",
    producesOutput: false,
    consumesInput: false,
    sidebarSchema: {
      fields: [
        { key: "content", label: "Note Content", type: "textarea", placeholder: "Add your documentation here..." },
        { key: "color", label: "Note Color", type: "select", defaultValue: "yellow", options: [{label:"Yellow",value:"yellow"},{label:"Blue",value:"blue"},{label:"Green",value:"green"},{label:"Red",value:"red"}] },
      ],
    },
  },

  // ── RAG & MEMORY ─────────────────────────────────────────────────────────────
  {
    type: "embedding",
    label: "Embedding",
    category: "ai",
    uiTheme: "#06b6d4",
    group: "RAG & Memory",
    description: "Generate text embeddings",
    producesOutput: true,
    consumesInput: true,
    requiredCredentials: [
      { key: "apiKey", label: "API Key", required: true, secret: true },
    ],
    sidebarSchema: {
      fields: [
        { key: "provider", label: "Provider", type: "select", defaultValue: "openai", options: [{label:"OpenAI",value:"openai"},{label:"Cohere",value:"cohere"},{label:"HuggingFace",value:"huggingface"}] },
        { key: "model", label: "Model", type: "text", defaultValue: "text-embedding-3-small" },
        { key: "batchSize", label: "Batch Size", type: "number", defaultValue: 100 },
      ],
    },
  },
  {
    type: "vectorStore",
    label: "Vector Store",
    category: "db",
    uiTheme: "#06b6d4",
    group: "RAG & Memory",
    description: "Store/query embedding vectors",
    producesOutput: true,
    consumesInput: true,
    requiredCredentials: [
      { key: "apiKey", label: "API Key", required: true, secret: true },
      { key: "environment", label: "Environment/Host (optional)", required: false, secret: false },
    ],
    sidebarSchema: {
      fields: [
        { key: "provider", label: "Provider", type: "select", defaultValue: "pinecone", options: [{label:"Pinecone",value:"pinecone"},{label:"Weaviate",value:"weaviate"},{label:"Qdrant",value:"qdrant"},{label:"ChromaDB",value:"chroma"}] },
        { key: "namespace", label: "Namespace / Index", type: "text" },
        { key: "operation", label: "Operation", type: "select", defaultValue: "upsert", options: [{label:"Upsert",value:"upsert"},{label:"Query",value:"query"},{label:"Delete",value:"delete"}] },
        { key: "topK", label: "Top K Results", type: "number", defaultValue: 5 },
        { key: "scoreThreshold", label: "Score Threshold", type: "number", defaultValue: 0.7 },
      ],
    },
  },
  {
    type: "document",
    label: "RAG Document",
    category: "ai",
    uiTheme: "#06b6d4",
    group: "RAG & Memory",
    description: "Ingest document for RAG",
    producesOutput: true,
    consumesInput: false,
    requiredCredentials: [
      { key: "unstructuredApiKey", label: "Unstructured.io API Key (optional)", required: false, secret: true, placeholder: "For PDF/advanced parsing via Unstructured.io" },
    ],
    sidebarSchema: {
      fields: [
        { key: "sourceType", label: "Source Type", type: "select", defaultValue: "text", options: [{label:"Text",value:"text"},{label:"URL",value:"url"},{label:"PDF Upload",value:"pdf"},{label:"CSV",value:"csv"}] },
        { key: "content", label: "Content / URL", type: "textarea" },
        { key: "chunkSize", label: "Chunk Size (tokens)", type: "number", defaultValue: 500 },
        { key: "overlap", label: "Chunk Overlap", type: "number", defaultValue: 50 },
        { key: "metadata", label: "Metadata (JSON)", type: "textarea", placeholder: '{"source": "docs", "version": "1.0"}' },
      ],
    },
  },
  {
    type: "retriever",
    label: "Retriever",
    category: "ai",
    uiTheme: "#06b6d4",
    group: "RAG & Memory",
    description: "Vector similarity search",
    producesOutput: true,
    consumesInput: true,
    requiredCredentials: [
      { key: "vectorApiKey", label: "Vector Store API Key", required: true, secret: true, placeholder: "Pinecone / Weaviate / Qdrant API key" },
      { key: "vectorHost", label: "Vector Store Host (optional)", required: false, secret: false, placeholder: "https://xxx.pinecone.io" },
    ],
    sidebarSchema: {
      fields: [
        { key: "provider", label: "Provider", type: "select", defaultValue: "pinecone", options: [{label:"Pinecone",value:"pinecone"},{label:"Weaviate",value:"weaviate"},{label:"Qdrant",value:"qdrant"},{label:"ChromaDB",value:"chroma"}] },
        { key: "namespace", label: "Namespace / Index", type: "text" },
        { key: "topK", label: "Top K Results", type: "number", defaultValue: 5 },
        { key: "threshold", label: "Similarity Threshold", type: "number", defaultValue: 0.7 },
        { key: "rerank", label: "Enable Reranking", type: "boolean", defaultValue: false },
      ],
    },
  },
  {
    type: "ragPipeline",
    label: "RAG Pipeline",
    category: "ai",
    uiTheme: "#06b6d4",
    group: "RAG & Memory",
    description: "Complete retrieval-augmented generation",
    producesOutput: true,
    consumesInput: true,
    requiredCredentials: [
      { key: "llmApiKey", label: "LLM API Key", required: true, secret: true },
      { key: "vectorApiKey", label: "Vector Store API Key", required: true, secret: true },
    ],
    sidebarSchema: {
      fields: [
        { key: "model", label: "LLM Model", type: "text", defaultValue: "gpt-4o-mini" },
        { key: "systemPrompt", label: "System Prompt", type: "textarea", defaultValue: "Answer only based on the context provided. If unsure, say so." },
        { key: "topK", label: "Top K Documents", type: "number", defaultValue: 5 },
        { key: "streamResponse", label: "Stream Response", type: "boolean", defaultValue: false },
      ],
    },
  },

  // ── OBSERVABILITY ────────────────────────────────────────────────────────────
  {
    type: "executionLogger",
    label: "Logger",
    category: "observability",
    uiTheme: "#64748b",
    group: "Observability",
    description: "Log execution data",
    producesOutput: false,
    consumesInput: true,
    requiredCredentials: [
      { key: "webhookToken", label: "Webhook Auth Token (if URL destination)", required: false, secret: true, placeholder: "Bearer token for your log endpoint" },
    ],
    sidebarSchema: {
      fields: [
        { key: "level", label: "Log Level", type: "select", defaultValue: "info", options: [{label:"Debug",value:"debug"},{label:"Info",value:"info"},{label:"Warning",value:"warn"},{label:"Error",value:"error"}] },
        { key: "template", label: "Message Template", type: "textarea", placeholder: "Step completed: {{result}}" },
        { key: "destination", label: "Destination", type: "select", defaultValue: "console", options: [{label:"Console",value:"console"},{label:"External Webhook",value:"url"},{label:"Supabase",value:"supabase"}] },
        { key: "webhookUrl", label: "Webhook URL (if external)", type: "url", placeholder: "https://logs.example.com/ingest" },
      ],
    },
  },
  {
    type: "metricsSink",
    label: "Metrics Sink",
    category: "observability",
    uiTheme: "#64748b",
    group: "Observability",
    description: "Emit metrics to observability providers",
    producesOutput: false,
    consumesInput: true,
    requiredCredentials: [
      { key: "providerApiKey", label: "Provider API Key", required: false, secret: true, placeholder: "Datadog / Grafana Cloud / New Relic API key" },
      { key: "providerEndpoint", label: "Custom Endpoint (optional)", required: false, secret: false, placeholder: "https://api.datadoghq.com/..." },
    ],
    sidebarSchema: {
      fields: [
        { key: "provider", label: "Provider", type: "select", defaultValue: "console", options: [{label:"Console (Debug)",value:"console"},{label:"Datadog",value:"datadog"},{label:"Grafana Cloud",value:"grafana"},{label:"New Relic",value:"newrelic"},{label:"Custom Endpoint",value:"custom"}] },
        { key: "metricName", label: "Metric Name", type: "text", placeholder: "workflow.execution.time" },
        { key: "tags", label: "Tags (JSON)", type: "textarea", placeholder: '{"env": "prod", "region": "us-east"}' },
      ],
    },
  },
  {
    type: "errorBoundary",
    label: "Error Boundary",
    category: "observability",
    uiTheme: "#ef4444",
    group: "Observability",
    description: "Handle errors gracefully",
    producesOutput: true,
    consumesInput: true,
    requiredCredentials: [
      { key: "alertWebhookToken", label: "Alert Webhook Token (optional)", required: false, secret: true, placeholder: "Bearer token for error alert endpoint" },
    ],
    sidebarSchema: {
      fields: [
        { key: "fallbackValue", label: "Fallback Value", type: "text", placeholder: "null" },
        { key: "retryOnError", label: "Retry on Error", type: "boolean", defaultValue: false },
        { key: "notifyOnError", label: "Send Notification on Error", type: "boolean", defaultValue: false },
        { key: "alertWebhookUrl", label: "Alert Webhook URL (if notify)", type: "url", placeholder: "https://hooks.slack.com/..." },
      ],
    },
  },
];

// ── Lookup helpers ────────────────────────────────────────────────────────────
export function getNodeDefinition(type: string): NodeDefinition | undefined {
  return NODE_DEFINITIONS.find((d) => d.type === type);
}

export function getNodesByCategory(category: NodeCategory): NodeDefinition[] {
  return NODE_DEFINITIONS.filter((d) => d.category === category);
}

export function getNodesByGroup(group: string): NodeDefinition[] {
  return NODE_DEFINITIONS.filter((d) => d.group === group);
}

export const ALL_GROUPS: NodeDefinition["group"][] = [
  "Triggers",
  "AI & Core",
  "Logic & Flow",
  "Data & Transform",
  "Integrations",
  "Auth & Identity",
  "Bots & Messaging",
  "RAG & Memory",
  "Observability",
];

// Theme color map for groups
export const GROUP_THEME: Record<string, string> = {
  "Triggers": "#f59e0b",
  "AI & Core": "#10b981",
  "Logic & Flow": "#3b82f6",
  "Data & Transform": "#8b5cf6",
  "Integrations": "#f97316",
  "Auth & Identity": "#6366f1",
  "Bots & Messaging": "#0ea5e9",
  "RAG & Memory": "#06b6d4",
  "Observability": "#64748b",
};
