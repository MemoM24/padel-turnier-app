import { z } from "zod";
import { COOKIE_NAME } from "../shared/const.js";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import * as db from "./db";

// In-memory store for join requests (keyed by tournamentId)
// Format: { [tournamentId]: { [requestId]: { name, status, timestamp } } }
const joinRequests: Record<string, Record<string, { name: string; status: 'pending' | 'approved' | 'rejected'; timestamp: number }>> = {};

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

  // Join request API – no auth required, uses in-memory store
  join: router({
    // Player submits a join request
    request: publicProcedure
      .input(z.object({
        tournamentId: z.string().min(1).max(64),
        name: z.string().min(1).max(50),
      }))
      .mutation(({ input }) => {
        const { tournamentId, name } = input;
        if (!joinRequests[tournamentId]) {
          joinRequests[tournamentId] = {};
        }
        // Check for duplicate name
        const existing = Object.values(joinRequests[tournamentId]).find(r => r.name === name);
        if (existing) {
          // Return the existing request id
          const id = Object.keys(joinRequests[tournamentId]).find(k => joinRequests[tournamentId][k].name === name)!;
          return { requestId: id, status: existing.status };
        }
        const requestId = `req_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
        joinRequests[tournamentId][requestId] = {
          name,
          status: 'pending',
          timestamp: Date.now(),
        };
        return { requestId, status: 'pending' as const };
      }),

    // Player polls for their request status
    checkStatus: publicProcedure
      .input(z.object({
        tournamentId: z.string().min(1).max(64),
        requestId: z.string().min(1).max(64),
      }))
      .query(({ input }) => {
        const req = joinRequests[input.tournamentId]?.[input.requestId];
        if (!req) return { status: 'not_found' as const };
        return { status: req.status, name: req.name };
      }),

    // Admin fetches all pending requests for a tournament
    listPending: publicProcedure
      .input(z.object({ tournamentId: z.string().min(1).max(64) }))
      .query(({ input }) => {
        const requests = joinRequests[input.tournamentId] ?? {};
        return Object.entries(requests)
          .filter(([, r]) => r.status === 'pending')
          .map(([id, r]) => ({ id, name: r.name, timestamp: r.timestamp }))
          .sort((a, b) => a.timestamp - b.timestamp);
      }),

    // Admin approves or rejects a request
    decide: publicProcedure
      .input(z.object({
        tournamentId: z.string().min(1).max(64),
        requestId: z.string().min(1).max(64),
        decision: z.enum(['approved', 'rejected']),
      }))
      .mutation(({ input }) => {
        const req = joinRequests[input.tournamentId]?.[input.requestId];
        if (!req) return { ok: false };
        req.status = input.decision;
        return { ok: true, name: req.name };
      }),
  }),
});

export type AppRouter = typeof appRouter;
