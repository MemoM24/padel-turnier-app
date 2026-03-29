import { z } from "zod";
import { COOKIE_NAME } from "../shared/const.js";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import * as db from "./db";

export const appRouter = router({
  // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // Public tournament API for QR viewer (no auth required)
  tournament: router({
    // Upload/update tournament data from the app
    upsert: publicProcedure
      .input(z.object({
        id: z.string().min(1).max(64),
        data: z.string().min(1), // serialized Tournament JSON
      }))
      .mutation(async ({ input }) => {
        await db.upsertTournament(input.id, input.data);
        return { ok: true };
      }),

    // Fetch tournament data for the viewer
    get: publicProcedure
      .input(z.object({ id: z.string().min(1).max(64) }))
      .query(async ({ input }) => {
        const data = await db.getTournamentById(input.id);
        if (!data) return null;
        return JSON.parse(data);
      }),
  }),
});

export type AppRouter = typeof appRouter;
