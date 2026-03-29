/**
 * serverSync.ts
 * Uploads tournament data to the backend so the public QR viewer can display it.
 * Also provides join request API functions for the player join system.
 * Uses a plain fetch (not tRPC hooks) so it can be called from any context.
 */
import { Platform } from "react-native";
import { Tournament } from "@/types";

// Deployed production domain for the viewer (always accessible)
const PRODUCTION_DOMAIN = "https://padeltourn-zrpcbsth.manus.space";

function getApiBase(): string {
  // On native, EXPO_PUBLIC_API_BASE_URL is set by the platform
  const envUrl = process.env.EXPO_PUBLIC_API_BASE_URL;
  if (envUrl) return envUrl.replace(/\/$/, "");

  // On web, derive from current hostname (8081 → 3000)
  if (Platform.OS === "web" && typeof window !== "undefined") {
    const { protocol, hostname } = window.location;
    const apiHostname = hostname.replace(/^8081-/, "3000-");
    if (apiHostname !== hostname) return `${protocol}//${apiHostname}`;
  }

  // On native device (Expo Go / APK): use the deployed production domain
  return PRODUCTION_DOMAIN;
}

export function getViewerUrl(tournamentId: string): string {
  const base = getApiBase();
  return `${base}/view?id=${tournamentId}`;
}

export function getJoinUrl(tournamentId: string): string {
  const base = getApiBase();
  return `${base}/view?id=${tournamentId}&join=1`;
}

export async function syncTournamentToServer(tournament: Tournament): Promise<void> {
  const base = getApiBase();
  if (!base) {
    // No server available (e.g. offline local dev without env var) – silently skip
    return;
  }
  try {
    const url = `${base}/api/trpc/tournament.upsert`;
    const body = JSON.stringify({
      json: {
        id: tournament.id,
        data: JSON.stringify(tournament),
      },
    });
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
    });
  } catch (err) {
    // Non-fatal – local tournament data is always the source of truth
    console.warn("[serverSync] Failed to sync tournament:", err);
  }
}

// ─── Join Request API ─────────────────────────────────────────────────────────

export async function submitJoinRequest(tournamentId: string, name: string): Promise<{ requestId: string; status: string } | null> {
  const base = getApiBase();
  try {
    const url = `${base}/api/trpc/join.request`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ json: { tournamentId, name } }),
    });
    const json = await res.json();
    return json?.result?.data?.json ?? null;
  } catch {
    return null;
  }
}

export async function checkJoinStatus(tournamentId: string, requestId: string): Promise<{ status: string; name?: string } | null> {
  const base = getApiBase();
  try {
    const input = encodeURIComponent(JSON.stringify({ json: { tournamentId, requestId } }));
    const res = await fetch(`${base}/api/trpc/join.checkStatus?input=${input}`);
    const json = await res.json();
    return json?.result?.data?.json ?? null;
  } catch {
    return null;
  }
}

export async function listPendingJoinRequests(tournamentId: string): Promise<Array<{ id: string; name: string; timestamp: number }>> {
  const base = getApiBase();
  try {
    const input = encodeURIComponent(JSON.stringify({ json: { tournamentId } }));
    const res = await fetch(`${base}/api/trpc/join.listPending?input=${input}`);
    const json = await res.json();
    return json?.result?.data?.json ?? [];
  } catch {
    return [];
  }
}

export async function decideJoinRequest(tournamentId: string, requestId: string, decision: 'approved' | 'rejected'): Promise<boolean> {
  const base = getApiBase();
  try {
    const url = `${base}/api/trpc/join.decide`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ json: { tournamentId, requestId, decision } }),
    });
    const json = await res.json();
    return json?.result?.data?.json?.ok ?? false;
  } catch {
    return false;
  }
}
