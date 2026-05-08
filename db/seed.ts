import { getDb } from "../api/queries/connection";
import { workflows, apiConfigs, pipelineRuns } from "./schema";

async function seed() {
  const db = getDb();

  console.log("Seeding database...");

  // Seed demo workflows
  const demoWorkflows = [
    {
      name: "Customer Request Classifier",
      description: "Automatically classify incoming customer requests by priority",
      type: "classification" as const,
      status: "active" as const,
      geminiModel: "gemini-2.0-flash-lite",
      promptTemplate: `Classify the following customer request into exactly one priority category.\n\nCATEGORIES: urgent, normal, low-priority\n\nINPUT TEXT:\n{{input}}\n\nRespond with JSON:\n{\n  "category": "chosen_category",\n  "confidence": 0.95,\n  "reasoning": "brief explanation"\n}`,
      inputSchema: '{"text": "string", "categories": ["string"]}',
      outputSchema: '{"category": "string", "confidence": "number", "reasoning": "string"}',
      webhookUrl: "http://localhost:5678/webhook/auto-classify",
      processedCount: 156,
      avgResponseTime: 145,
    },
    {
      name: "Lead Data Extractor",
      description: "Extract structured lead information from emails and messages",
      type: "extraction" as const,
      status: "active" as const,
      geminiModel: "gemini-2.0-flash-lite",
      promptTemplate: `Extract the following fields from the lead text:\nFIELDS: name, email, phone, company, role\n\nINPUT TEXT:\n{{input}}\n\nRespond with JSON:\n{\n  "extracted": {\n    "field_name": "value_or_null"\n  },\n  "confidence": 0.95,\n  "fields_found": 0,\n  "fields_total": 5\n}`,
      inputSchema: '{"text": "string", "fields": ["string"]}',
      outputSchema: '{"extracted": "object", "confidence": "number"}',
      webhookUrl: "http://localhost:5678/webhook/data-extract",
      processedCount: 89,
      avgResponseTime: 132,
    },
    {
      name: "Support Ticket Router",
      description: "Route support tickets to appropriate teams",
      type: "routing" as const,
      status: "active" as const,
      geminiModel: "gemini-2.0-flash-lite",
      promptTemplate: `Determine the best team for this support ticket.\n\nROUTES:\n- technical: Technical issues, bugs, errors\n- billing: Billing, payments, subscriptions\n- general: General questions, feedback\n\nINPUT REQUEST:\n{{input}}\n\nRespond with JSON:\n{\n  "route": "chosen_route",\n  "confidence": 0.95,\n  "reasoning": "brief explanation",\n  "priority": "normal"\n}`,
      inputSchema: '{"text": "string", "routes": "object"}',
      outputSchema: '{"route": "string", "confidence": "number"}',
      webhookUrl: "http://localhost:5678/webhook/smart-route",
      processedCount: 203,
      avgResponseTime: 118,
    },
    {
      name: "Document Analyzer",
      description: "Extract key information from uploaded documents",
      type: "extraction" as const,
      status: "draft" as const,
      geminiModel: "gemini-1.5-pro",
      promptTemplate: "Extract all relevant information from the document text...",
      processedCount: 0,
      avgResponseTime: 0,
    },
  ];

  for (const wf of demoWorkflows) {
    await db.insert(workflows).values(wf);
  }
  console.log(`✓ Inserted ${demoWorkflows.length} workflows`);

  // Seed demo API config
  await db.insert(apiConfigs).values({
    name: "Default Gemini",
    service: "gemini",
    model: "gemini-2.0-flash-lite",
    isDefault: true,
    isActive: true,
  });
  console.log("✓ Inserted default API config");

  // Seed demo pipeline runs
  const statuses = ["completed", "completed", "completed", "failed", "running", "pending"] as const;
  const categories = ["urgent", "normal", "low-priority", "technical", "sales"] as const;

  for (let i = 0; i < 25; i++) {
    const workflowId = (i % 3) + 1;
    const status = statuses[i % statuses.length];
    await db.insert(pipelineRuns).values({
      workflowId,
      status,
      inputData: JSON.stringify({ text: `Sample input data #${i + 1} for processing` }),
      outputData: status === "completed" ? JSON.stringify({ category: categories[i % categories.length], confidence: 0.9 + Math.random() * 0.09 }) : null,
      errorMessage: status === "failed" ? "Simulated error for testing" : null,
      processingTimeMs: status === "completed" ? Math.floor(80 + Math.random() * 200) : null,
      tokensUsed: status === "completed" ? Math.floor(40 + Math.random() * 100) : null,
      classificationResult: status === "completed" ? categories[i % categories.length] : null,
    });
  }
  console.log("✓ Inserted 25 pipeline runs");

  console.log("Seeding complete!");
}

seed().catch(console.error);
