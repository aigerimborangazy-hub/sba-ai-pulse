// ============================================================
// SBA AI Pulse — Digest file I/O utilities
// Reads/writes dated JSON digest files to the /data directory.
// ============================================================

import fs from "fs";
import path from "path";
import type { Digest } from "./types";

// On Vercel the project filesystem is read-only; /tmp is writable.
// Locally we use /data inside the project root for convenience.
const DATA_DIR =
  process.env.VERCEL ? path.join("/tmp", "sba-ai-pulse", "data") : path.join(process.cwd(), "data");

/** Ensure /data directory exists */
function ensureDataDir(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

/** Get the file path for a dated digest */
export function digestFilePath(date: string): string {
  return path.join(DATA_DIR, `digest-${date}.json`);
}

/**
 * Save a digest to disk as digest-YYYY-MM-DD.json
 */
export function saveDigest(digest: Digest): void {
  ensureDataDir();
  const filePath = digestFilePath(digest.date);
  fs.writeFileSync(filePath, JSON.stringify(digest, null, 2), "utf-8");
}

/**
 * Load a dated digest from disk.
 * Returns null if the file doesn't exist.
 */
export function loadDigest(date: string): Digest | null {
  const filePath = digestFilePath(date);
  if (!fs.existsSync(filePath)) return null;
  try {
    const raw = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(raw) as Digest;
  } catch {
    return null;
  }
}

/**
 * Find the most recent digest file on disk.
 * Scans /data for digest-*.json files and returns the one with the latest date.
 */
export function loadLatestDigest(): Digest | null {
  ensureDataDir();
  let latest: Digest | null = null;
  try {
    const files = fs.readdirSync(DATA_DIR).filter((f) => /^digest-\d{4}-\d{2}-\d{2}\.json$/.test(f));
    files.sort().reverse(); // descending by date
    for (const file of files) {
      const digest = loadDigest(file.replace("digest-", "").replace(".json", ""));
      if (digest && digest.items.length > 0) {
        latest = digest;
        break;
      }
    }
  } catch {
    // ignore read errors
  }
  return latest;
}

/** Today's date as YYYY-MM-DD (UTC) */
export function todayUTC(): string {
  return new Date().toISOString().slice(0, 10);
}
