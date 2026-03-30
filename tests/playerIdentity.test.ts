import { describe, it, expect } from 'vitest';
import {
  validateFirstName,
  validateLastName,
  validateBirthdate,
  capitalizeName,
  generatePlayerHash,
} from '../lib/playerIdentity';

// ─── capitalizeName ───────────────────────────────────────────────────────────
describe('capitalizeName', () => {
  it('capitalises first letter of each word', () => {
    expect(capitalizeName('max')).toBe('Max');
    expect(capitalizeName('max mustermann')).toBe('Max Mustermann');
    expect(capitalizeName('ANNA')).toBe('ANNA'); // already uppercase
  });

  it('handles single character', () => {
    expect(capitalizeName('a')).toBe('A');
  });
});

// ─── validateFirstName ────────────────────────────────────────────────────────
describe('validateFirstName', () => {
  it('returns null for valid names', () => {
    expect(validateFirstName('Max')).toBeNull();
    expect(validateFirstName('Anna-Maria')).toBeNull();
    expect(validateFirstName('Jürgen')).toBeNull();
  });

  it('rejects empty string', () => {
    expect(validateFirstName('')).not.toBeNull();
    expect(validateFirstName('   ')).not.toBeNull();
  });

  it('rejects names with numbers', () => {
    expect(validateFirstName('Max1')).not.toBeNull();
  });

  it('rejects names longer than 20 characters', () => {
    expect(validateFirstName('A'.repeat(21))).not.toBeNull();
  });

  it('accepts names with exactly 20 characters', () => {
    expect(validateFirstName('A'.repeat(20))).toBeNull();
  });
});

// ─── validateLastName ─────────────────────────────────────────────────────────
describe('validateLastName', () => {
  it('returns null for valid names', () => {
    expect(validateLastName('Mustermann')).toBeNull();
    expect(validateLastName('von der Heyden')).toBeNull();
  });

  it('rejects empty string', () => {
    expect(validateLastName('')).not.toBeNull();
  });

  it('rejects names with special characters', () => {
    expect(validateLastName('Smith!')).not.toBeNull();
  });
});

// ─── validateBirthdate ───────────────────────────────────────────────────────
describe('validateBirthdate', () => {
  const now = new Date();
  const validYear = now.getFullYear() - 25;
  const validDate = `15.06.${validYear}`;

  it('accepts a valid date', () => {
    expect(validateBirthdate(validDate)).toBeNull();
  });

  it('rejects empty string', () => {
    expect(validateBirthdate('')).not.toBeNull();
  });

  it('rejects invalid month', () => {
    expect(validateBirthdate(`15.13.${validYear}`)).not.toBeNull();
  });

  it('rejects invalid day', () => {
    expect(validateBirthdate(`32.01.${validYear}`)).not.toBeNull();
  });

  it('rejects non-existent date (Feb 30)', () => {
    expect(validateBirthdate(`30.02.${validYear}`)).not.toBeNull();
  });

  it('rejects age below 10 years', () => {
    const tooYoung = now.getFullYear() - 5;
    expect(validateBirthdate(`01.01.${tooYoung}`)).not.toBeNull();
  });

  it('rejects age above 90 years', () => {
    const tooOld = now.getFullYear() - 91;
    expect(validateBirthdate(`01.01.${tooOld}`)).not.toBeNull();
  });

  it('accepts minimum age (exactly 10 years)', () => {
    const tenYearsAgo = new Date(now);
    tenYearsAgo.setFullYear(tenYearsAgo.getFullYear() - 10);
    tenYearsAgo.setDate(tenYearsAgo.getDate() - 1); // one day past 10th birthday
    const d = String(tenYearsAgo.getDate()).padStart(2, '0');
    const m = String(tenYearsAgo.getMonth() + 1).padStart(2, '0');
    const y = tenYearsAgo.getFullYear();
    expect(validateBirthdate(`${d}.${m}.${y}`)).toBeNull();
  });
});

// ─── generatePlayerHash ───────────────────────────────────────────────────────
describe('generatePlayerHash', () => {
  it('returns a 16-character hex string', async () => {
    const hash = await generatePlayerHash('Max', 'Mustermann', '15.06.1990');
    expect(hash).toHaveLength(16);
    expect(hash).toMatch(/^[0-9a-f]+$/);
  });

  it('is deterministic for the same inputs', async () => {
    const h1 = await generatePlayerHash('Max', 'Mustermann', '15.06.1990');
    const h2 = await generatePlayerHash('Max', 'Mustermann', '15.06.1990');
    expect(h1).toBe(h2);
  });

  it('produces different hashes for different inputs', async () => {
    const h1 = await generatePlayerHash('Max', 'Mustermann', '15.06.1990');
    const h2 = await generatePlayerHash('Anna', 'Schmidt', '20.03.1985');
    expect(h1).not.toBe(h2);
  });

  it('is case-insensitive (normalises to lowercase)', async () => {
    const h1 = await generatePlayerHash('MAX', 'MUSTERMANN', '15.06.1990');
    const h2 = await generatePlayerHash('max', 'mustermann', '15.06.1990');
    expect(h1).toBe(h2);
  });

  it('is sensitive to birthdate differences', async () => {
    const h1 = await generatePlayerHash('Max', 'Mustermann', '15.06.1990');
    const h2 = await generatePlayerHash('Max', 'Mustermann', '16.06.1990');
    expect(h1).not.toBe(h2);
  });
});
