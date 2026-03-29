/**
 * serverSync.ts
 * Uploads tournament data to the backend so the public QR viewer can display it.
 * Uses a plain fetch (not tRPC hooks) so it can be called from any context.
 */
import { Platform } from "react-native";
import { Tournament } from "@/types";

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

  // Fallback for local dev on device (Expo Go connects to LAN IP)
  return "";
}

export function getViewerUrl(tournamentId: string): string {
  const base = getApiBase();
  return `${base}/view?id=${tournamentId}`;
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
