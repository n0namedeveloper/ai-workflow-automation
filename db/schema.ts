import {
  mysqlTable,
  mysqlEnum,
  serial,
  varchar,
  text,
  timestamp,
  bigint,
  json,
  int,
  boolean,
} from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: serial("id").primaryKey(),
  unionId: varchar("unionId", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }),
  email: varchar("email", { length: 320 }),
  avatar: text("avatar"),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
  lastSignInAt: timestamp("lastSignInAt").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// Workflows table - stores n8n workflow configurations
export const workflows = mysqlTable("workflows", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  type: mysqlEnum("type", ["classification", "extraction", "routing", "custom"]).notNull(),
  status: mysqlEnum("status", ["active", "inactive", "draft"]).default("draft").notNull(),
  n8nWorkflowJson: text("n8n_workflow_json"),
  geminiModel: varchar("gemini_model", { length: 100 }).default("gemini-2.0-flash-lite"),
  promptTemplate: text("prompt_template"),
  inputSchema: text("input_schema"),
  outputSchema: text("output_schema"),
  webhookUrl: varchar("webhook_url", { length: 500 }),
  processedCount: int("processed_count").default(0),
  avgResponseTime: int("avg_response_time").default(0),
  createdBy: bigint("created_by", { mode: "number", unsigned: true }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull().$onUpdate(() => new Date()),
});

export type Workflow = typeof workflows.$inferSelect;
export type InsertWorkflow = typeof workflows.$inferInsert;

// Pipeline runs - execution logs
export const pipelineRuns = mysqlTable("pipeline_runs", {
  id: serial("id").primaryKey(),
  workflowId: bigint("workflow_id", { mode: "number", unsigned: true }).notNull(),
  status: mysqlEnum("status", ["pending", "running", "completed", "failed", "cancelled"]).default("pending").notNull(),
  inputData: text("input_data"),
  outputData: text("output_data"),
  errorMessage: text("error_message"),
  processingTimeMs: int("processing_time_ms"),
  tokensUsed: int("tokens_used"),
  classificationResult: varchar("classification_result", { length: 255 }),
  routedTo: varchar("routed_to", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type PipelineRun = typeof pipelineRuns.$inferSelect;
export type InsertPipelineRun = typeof pipelineRuns.$inferInsert;

// API configurations
export const apiConfigs = mysqlTable("api_configs", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  service: mysqlEnum("service", ["gemini", "openai", "custom"]).notNull(),
  apiKey: varchar("api_key", { length: 500 }),
  baseUrl: varchar("base_url", { length: 500 }),
  model: varchar("model", { length: 255 }),
  isDefault: boolean("is_default").default(false),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull().$onUpdate(() => new Date()),
});

export type ApiConfig = typeof apiConfigs.$inferSelect;
export type InsertApiConfig = typeof apiConfigs.$inferInsert;

// Classification results
export const classificationResults = mysqlTable("classification_results", {
  id: serial("id").primaryKey(),
  runId: bigint("run_id", { mode: "number", unsigned: true }).notNull(),
  category: varchar("category", { length: 255 }).notNull(),
  confidence: varchar("confidence", { length: 50 }),
  extractedFields: text("extracted_fields"),
  rawInput: text("raw_input"),
  processedOutput: text("processed_output"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
