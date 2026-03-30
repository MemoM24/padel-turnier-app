/**
 * playerIdentity.ts
 *
 * Generates and persists an anonymous player identity based on:
 *   Vorname + Nachname + Geburtsdatum  →  SHA-256 hash (hex, first 16 chars)
 *
 * The hash is stored locally in AsyncStorage so the player is automatically
 * recognised on subsequent visits without re-entering their details.
 *
 * Privacy: no raw personal data is ever stored or transmitted.
 * Only the display name (Vorname + " " + Nachname) and the hash are kept.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// ─── Storage key ──────────────────────────────────────────────────────────────
const IDENTITY_KEY = 'padelPlayerIdentity';

// ─── Types ────────────────────────────────────────────────────────────────────
export interface PlayerIdentity {
  /** Display name shown in the join request: "Max Mustermann" */
  displayName: string;
  /** SHA-256 hex hash (first 16 chars) of "vorname|nachname|dd.mm.yyyy" */
  hash: string;
  /** ISO timestamp when the identity was first created */
  createdAt: string;
}

// ─── Validation helpers ───────────────────────────────────────────────────────

/** Only letters (including German umlauts), hyphens and spaces. */
const NAME_REGEX = /^[A-Za-zÄäÖöÜüß\- ]+$/;

export function validateFirstName(value: string): string | null {
  const v = value.trim();
  if (!v) return 'Vorname ist erforderlich.';
  if (!NAME_REGEX.test(v)) return 'Nur Buchstaben erlaubt.';
  if (v.length > 20) return 'Maximal 20 Zeichen.';
  return null;
}

export function validateLastName(value: string): string | null {
  const v = value.trim();
  if (!v) return 'Nachname ist erforderlich.';
  if (!NAME_REGEX.test(v)) return 'Nur Buchstaben erlaubt.';
  if (v.length > 20) return 'Maximal 20 Zeichen.';
  return null;
}

/**
 * Validates a birthdate string in "DD.MM.YYYY" format.
 * Minimum age: 10 years. Maximum age: 90 years.
 */
export function validateBirthdate(value: string): string | null {
  if (!value || value.length !== 10) return 'Geburtsdatum ist erforderlich.';
  const [dd, mm, yyyy] = value.split('.');
  const day = parseInt(dd, 10);
  const month = parseInt(mm, 10);
  const year = parseInt(yyyy, 10);

  if (isNaN(day) || isNaN(month) || isNaN(year)) return 'Ungültiges Datum.';
  if (month < 1 || month > 12) return 'Ungültiger Monat.';
  if (day < 1 || day > 31) return 'Ungültiger Tag.';

  const date = new Date(year, month - 1, day);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return 'Ungültiges Datum.';
  }

  const now = new Date();
  const ageMs = now.getTime() - date.getTime();
  const ageYears = ageMs / (1000 * 60 * 60 * 24 * 365.25);

  if (ageYears < 10) return 'Mindestalter: 10 Jahre.';
  if (ageYears > 90) return 'Maximalalter: 90 Jahre.';

  return null;
}

// ─── Capitalise first letter of each word ─────────────────────────────────────
export function capitalizeName(value: string): string {
  return value
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// ─── SHA-256 hash ─────────────────────────────────────────────────────────────

/**
 * Computes a SHA-256 hash of the input string.
 * Uses the Web Crypto API on native (React Native 0.71+ / Hermes) and web.
 * Falls back to a simple djb2 hash if crypto is unavailable.
 */
async function sha256Hex(input: string): Promise<string> {
  try {
    if (
      typeof globalThis.crypto !== 'undefined' &&
      globalThis.crypto.subtle
    ) {
      const encoder = new TextEncoder();
      const data = encoder.encode(input);
      const hashBuffer = await globalThis.crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
    }
  } catch {
    // fall through to djb2
  }

  // Fallback: djb2 (not cryptographic, but deterministic)
  let hash = 5381;
  for (let i = 0; i < input.length; i++) {
    hash = ((hash << 5) + hash) ^ input.charCodeAt(i);
    hash = hash >>> 0; // keep 32-bit unsigned
  }
  return hash.toString(16).padStart(8, '0').repeat(2); // 16 hex chars
}

/**
 * Generates a player identity hash from the given personal data.
 * Input is normalised to lowercase before hashing.
 */
export async function generatePlayerHash(
  firstName: string,
  lastName: string,
  birthdate: string, // "DD.MM.YYYY"
): Promise<string> {
  const normalised = `${firstName.trim().toLowerCase()}|${lastName.trim().toLowerCase()}|${birthdate.trim()}`;
  const full = await sha256Hex(normalised);
  return full.slice(0, 16); // first 16 hex chars = 64 bits
}

// ─── AsyncStorage persistence ─────────────────────────────────────────────────

export async function savePlayerIdentity(identity: PlayerIdentity): Promise<void> {
  try {
    await AsyncStorage.setItem(IDENTITY_KEY, JSON.stringify(identity));
  } catch {}
}

export async function loadPlayerIdentity(): Promise<PlayerIdentity | null> {
  try {
    const raw = await AsyncStorage.getItem(IDENTITY_KEY);
    return raw ? (JSON.parse(raw) as PlayerIdentity) : null;
  } catch {
    return null;
  }
}

export async function clearPlayerIdentity(): Promise<void> {
  try {
    await AsyncStorage.removeItem(IDENTITY_KEY);
  } catch {}
}

/**
 * Creates and persists a new player identity from the given inputs.
 * Returns the created identity.
 */
export async function createAndSaveIdentity(
  firstName: string,
  lastName: string,
  birthdate: string,
): Promise<PlayerIdentity> {
  const fn = capitalizeName(firstName.trim());
  const ln = capitalizeName(lastName.trim());
  const hash = await generatePlayerHash(fn, ln, birthdate.trim());
  const identity: PlayerIdentity = {
    displayName: `${fn} ${ln}`,
    hash,
    createdAt: new Date().toISOString(),
  };
  await savePlayerIdentity(identity);
  return identity;
}
