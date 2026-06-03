// ============================================================
// SBA AI Pulse — GET /api/digest
//
// Returns today's cached digest JSON, or 404 if none exists.
// Also serves as a fallback: if today's digest is missing,
// returns the most recent one available.
// ============================================================
import { NextResponse } from "next/server";
import { loadDigest, loadLatestDigest, todayUTC } from "@/lib/storage";

export async function GET() {
  const today = todayUTC();

  // Try today's digest first
  let digest = loadDigest(today);

  // Fallback to most recent available
  if (!digest) {
    digest = loadLatestDigest();
  }

  if (!digest) {
    return NextResponse.json(
      { error: "No digest available yet. Click 'Refresh' to generate." },
      { status: 404 }
    );
  }

  // Cache on Vercel edge for 24h so the portal loads instantly
  // even when serverless function instances don't share filesystem
  return NextResponse.json(digest, {
    headers: {
      "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=3600",
    },
  });
}
