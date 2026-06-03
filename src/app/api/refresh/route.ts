// ============================================================
// SBA AI Pulse — POST /api/refresh
//
// Protected by CRON_SECRET token. Runs the LLM news-gathering
// pipeline, validates results, saves to disk, returns the Digest.
//
// Callable by:
//   - Vercel Cron (daily at 02:00 UTC)
//   - Manual "Refresh" button in the UI
// ============================================================
import { NextRequest, NextResponse } from "next/server";
import { fetchNewsDigest } from "@/lib/fetchNews";
import { saveDigest, loadLatestDigest } from "@/lib/storage";

export async function POST(req: NextRequest) {
  // --- Auth check ---
  const authHeader = req.headers.get("authorization");
  const expectedToken = process.env.CRON_SECRET;

  if (!expectedToken) {
    return NextResponse.json(
      { error: "CRON_SECRET is not configured on the server" },
      { status: 500 }
    );
  }

  // Accept either "Bearer <token>" or raw token in header
  const providedToken = authHeader?.replace(/^Bearer\s+/i, "") || "";
  if (providedToken !== expectedToken) {
    return NextResponse.json(
      { error: "Unauthorized — invalid or missing CRON_SECRET" },
      { status: 401 }
    );
  }

  try {
    console.log("[refresh] Starting news digest generation...");
    const digest = await fetchNewsDigest();

    // Persist to disk
    saveDigest(digest);
    console.log(
      `[refresh] Digest saved: ${digest.items.length} items for ${digest.date}`
    );

    return NextResponse.json({
      success: true,
      digest,
      message: `Generated ${digest.items.length} items for ${digest.date}`,
    });
  } catch (error) {
    console.error("[refresh] Pipeline failed:", error);

    // Return previous digest if available so the UI isn't empty
    const fallback = loadLatestDigest();

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        fallback,
        fallbackDate: fallback?.date || null,
      },
      { status: 500 }
    );
  }
}
