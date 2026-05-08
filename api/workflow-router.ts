import { z } from "zod";
import { createRouter, publicQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { workflows, pipelineRuns, apiConfigs, classificationResults } from "@db/schema";
import { eq, desc, sql, count, and, gte } from "drizzle-orm";

export const workflowRouter = createRouter({
  // Workflow CRUD
  list: publicQuery
    .input(z.object({
      type: z.string().optional(),
      status: z.string().optional(),
    }).optional())
    .query(async ({ input }) => {
      const db = getDb();
      const conditions = [];
      if (input?.type) conditions.push(eq(workflows.type, input.type as any));
      if (input?.status) conditions.push(eq(workflows.status, input.status as any));
      
      return db.select().from(workflows)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(workflows.createdAt));
    }),

  getById: publicQuery
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = getDb();
      const results = await db.select().from(workflows)
        .where(eq(workflows.id, input.id))
        .limit(1);
      return results[0] || null;
    }),

  create: publicQuery
    .input(z.object({
      name: z.string().min(1),
      description: z.string().optional(),
      type: z.enum(["classification", "extraction", "routing", "custom"]),
      status: z.enum(["active", "inactive", "draft"]).default("draft"),
      geminiModel: z.string().default("gemini-2.0-flash-lite"),
      promptTemplate: z.string().optional(),
      inputSchema: z.string().optional(),
      outputSchema: z.string().optional(),
      webhookUrl: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const result = await db.insert(workflows).values({
        ...input,
        processedCount: 0,
        avgResponseTime: 0,
      });
      return { id: Number(result[0].insertId) };
    }),

  update: publicQuery
    .input(z.object({
      id: z.number(),
      name: z.string().optional(),
      description: z.string().optional(),
      status: z.enum(["active", "inactive", "draft"]).optional(),
      promptTemplate: z.string().optional(),
      geminiModel: z.string().optional(),
      inputSchema: z.string().optional(),
      outputSchema: z.string().optional(),
      webhookUrl: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      const db = getDb();
      await db.update(workflows).set(data).where(eq(workflows.id, id));
      return { success: true };
    }),

  delete: publicQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.delete(workflows).where(eq(workflows.id, input.id));
      return { success: true };
    }),

  // Pipeline runs
  runWorkflow: publicQuery
    .input(z.object({
      workflowId: z.number(),
      inputData: z.string(),
    }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const result = await db.insert(pipelineRuns).values({
        workflowId: input.workflowId,
        inputData: input.inputData,
        status: "pending",
      });
      return { id: Number(result[0].insertId) };
    }),

  listRuns: publicQuery
    .input(z.object({
      workflowId: z.number().optional(),
      limit: z.number().default(50),
    }).optional())
    .query(async ({ input }) => {
      const db = getDb();
      const conditions = [];
      if (input?.workflowId) conditions.push(eq(pipelineRuns.workflowId, input.workflowId));
      
      return db.select().from(pipelineRuns)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(pipelineRuns.createdAt))
        .limit(input?.limit || 50);
    }),

  updateRunStatus: publicQuery
    .input(z.object({
      id: z.number(),
      status: z.enum(["pending", "running", "completed", "failed", "cancelled"]),
      outputData: z.string().optional(),
      errorMessage: z.string().optional(),
      processingTimeMs: z.number().optional(),
      tokensUsed: z.number().optional(),
      classificationResult: z.string().optional(),
      routedTo: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      const db = getDb();
      await db.update(pipelineRuns).set(data).where(eq(pipelineRuns.id, id));
      return { success: true };
    }),

  // Stats
  stats: publicQuery.query(async () => {
    const db = getDb();
    const [workflowCount] = await db.select({ count: count() }).from(workflows);
    const [runCount] = await db.select({ count: count() }).from(pipelineRuns);
    const [completedCount] = await db.select({ count: count() }).from(pipelineRuns)
      .where(eq(pipelineRuns.status, "completed"));
    const [failedCount] = await db.select({ count: count() }).from(pipelineRuns)
      .where(eq(pipelineRuns.status, "failed"));
    
    const totalProcessingTime = await db.select({
      total: sql<number>`COALESCE(SUM(${pipelineRuns.processingTimeMs}), 0)`,
    }).from(pipelineRuns);
    
    const avgTime = runCount.count > 0 ? Math.round(totalProcessingTime[0].total / runCount.count) : 0;
    
    return {
      workflows: workflowCount.count,
      totalRuns: runCount.count,
      completed: completedCount.count,
      failed: failedCount.count,
      avgResponseTime: avgTime,
      successRate: runCount.count > 0 ? Math.round((completedCount.count / runCount.count) * 100) : 0,
    };
  }),

  recentActivity: publicQuery.query(async () => {
    const db = getDb();
    return db.select({
      id: pipelineRuns.id,
      status: pipelineRuns.status,
      classificationResult: pipelineRuns.classificationResult,
      processingTimeMs: pipelineRuns.processingTimeMs,
      createdAt: pipelineRuns.createdAt,
      workflowName: workflows.name,
    })
    .from(pipelineRuns)
    .leftJoin(workflows, eq(pipelineRuns.workflowId, workflows.id))
    .orderBy(desc(pipelineRuns.createdAt))
    .limit(20);
  }),
});

export const apiConfigRouter = createRouter({
  list: publicQuery.query(async () => {
    const db = getDb();
    return db.select({
      id: apiConfigs.id,
      name: apiConfigs.name,
      service: apiConfigs.service,
      baseUrl: apiConfigs.baseUrl,
      model: apiConfigs.model,
      isDefault: apiConfigs.isDefault,
      isActive: apiConfigs.isActive,
      createdAt: apiConfigs.createdAt,
    }).from(apiConfigs).orderBy(desc(apiConfigs.createdAt));
  }),

  create: publicQuery
    .input(z.object({
      name: z.string().min(1),
      service: z.enum(["gemini", "openai", "custom"]),
      apiKey: z.string().optional(),
      baseUrl: z.string().optional(),
      model: z.string().optional(),
      isDefault: z.boolean().default(false),
    }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const result = await db.insert(apiConfigs).values(input);
      return { id: Number(result[0].insertId) };
    }),

  delete: publicQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.delete(apiConfigs).where(eq(apiConfigs.id, input.id));
      return { success: true };
    }),
});
