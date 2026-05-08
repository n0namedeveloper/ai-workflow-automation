import { authRouter } from "./auth-router";
import { workflowRouter, apiConfigRouter } from "./workflow-router";
import { createRouter, publicQuery } from "./middleware";

export const appRouter = createRouter({
  ping: publicQuery.query(() => ({ ok: true, ts: Date.now() })),
  auth: authRouter,
  workflow: workflowRouter,
  apiConfig: apiConfigRouter,
});

export type AppRouter = typeof appRouter;
