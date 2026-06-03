// ============================================================
// SBA AI Pulse — News fetching pipeline via OpenRouter (Perplexity Sonar)
// ============================================================
import { buildNewsPrompt } from "./prompt";
import type { Digest, DigestItem } from "./types";
import { GOV_PRIORITIES_COUNT } from "./constants";
import { todayUTC } from "./storage";
import crypto from "crypto";

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";
// Perplexity Sonar Pro — has live web search and returns citations with better accuracy
const MODEL = "perplexity/sonar-pro";

interface OpenRouterResponse {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
  error?: {
    message?: string;
  };
}

/**
 * Fetch news from Perplexity-via-OpenRouter, parse JSON, validate, and return a Digest.
 *
 * Validation rules (hard):
 * - Every item MUST have a sourceUrl starting with "http"
 * - Items without valid sourceUrl are dropped
 * - Government instructions: verbatim quote + official URL only
 */
export async function fetchNewsDigest(): Promise<Digest> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY is not set in environment");
  }

  const prompt = buildNewsPrompt();

  const response = await fetch(OPENROUTER_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      // Required by OpenRouter
      "HTTP-Referer": process.env.VERCEL_URL || "http://localhost:3000",
      "X-Title": "SBA AI Pulse",
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.3,
      max_tokens: 6000,
    }),
    // Perplexity search can take a while
    signal: AbortSignal.timeout(120_000), // 2 minutes
  });

  if (!response.ok) {
    const errBody = await response.text().catch(() => "");
    throw new Error(
      `OpenRouter API returned ${response.status}: ${errBody}`
    );
  }

  const data = (await response.json()) as OpenRouterResponse;

  if (data.error?.message) {
    throw new Error(`OpenRouter error: ${data.error.message}`);
  }

  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("Empty response from OpenRouter");
  }

  // Parse JSON — strip markdown code fences if present
  const jsonStr = content
    .replace(/^```(?:json)?\s*/m, "")
    .replace(/\s*```\s*$/m, "")
    .trim();

  let parsed: { items?: unknown[] };
  try {
    parsed = JSON.parse(jsonStr);
  } catch (parseErr) {
    // Log the raw content for debugging
    console.error("Failed to parse LLM JSON. Raw content:", content);
    throw new Error(
      `Failed to parse LLM response as JSON: ${parseErr instanceof Error ? parseErr.message : String(parseErr)}`
    );
  }

  if (!Array.isArray(parsed.items)) {
    throw new Error("LLM response did not contain an 'items' array");
  }

  // --- Validate and filter items ---
  const validatedItems: DigestItem[] = [];

  for (const raw of parsed.items) {
    const item = raw as Record<string, unknown>;

    // Hard rule: sourceUrl must exist and start with http
    const sourceUrl = typeof item.sourceUrl === "string" ? item.sourceUrl.trim() : "";
    if (!sourceUrl || !sourceUrl.startsWith("http")) {
      // Drop item — no valid source URL
      console.warn("Dropping item without valid sourceUrl:", item.title || "unknown");
      continue;
    }

    // Additional validation: reject obviously fake/placeholder URLs
    // (e.g. "https://example.com", "https://example.org", "https://placeholder.com")
    const fakePatterns = /example\.com|example\.org|placeholder|localhost|127\.0\.0\.1|fakeurl/i;
    if (fakePatterns.test(sourceUrl)) {
      console.warn("Dropping item with fake/placeholder sourceUrl:", sourceUrl);
      continue;
    }

    // Reject video/social media URLs — only text news articles allowed
    const videoPatterns = /youtube\.com|youtu\.be|tiktok\.com|instagram\.com|facebook\.com|vk\.com|dailymotion\.com|vimeo\.com|twitch\.tv/i;
    if (videoPatterns.test(sourceUrl)) {
      console.warn("Dropping item with video/social media sourceUrl:", sourceUrl);
      continue;
    }

    validatedItems.push({
      id: generateId(),
      title: typeof item.title === "string" ? item.title : "Без заголовка",
      summary: typeof item.summary === "string" ? item.summary : "",
      sourceUrl,
      sourceName: typeof item.sourceName === "string" ? item.sourceName : sourceUrl,
      publishedAt: typeof item.publishedAt === "string" ? item.publishedAt : "",
      industryTags: Array.isArray(item.industryTags)
        ? (item.industryTags as string[])
        : ["Кросс-отраслевое"],
      significance:
        item.significance === "high" || item.significance === "medium" || item.significance === "low"
          ? item.significance
          : "medium",
      actionPoint: typeof item.actionPoint === "string" ? item.actionPoint : "",
      training: {
        recommendation:
          typeof item.training === "object" && item.training !== null && "recommendation" in item.training
            ? String((item.training as Record<string, unknown>).recommendation)
            : "",
        existsInCatalog:
          typeof item.training === "object" && item.training !== null && "existsInCatalog" in item.training
            ? Boolean((item.training as Record<string, unknown>).existsInCatalog)
            : false,
        ticketSuggested:
          typeof item.training === "object" && item.training !== null && "ticketSuggested" in item.training
            ? Boolean((item.training as Record<string, unknown>).ticketSuggested)
            : false,
      },
      govAlignment: {
        priority:
          typeof item.govAlignment === "object" && item.govAlignment !== null && "priority" in item.govAlignment
            ? String((item.govAlignment as Record<string, unknown>).priority)
            : GOV_PRIORITIES_COUNT.toString(),
        note:
          typeof item.govAlignment === "object" && item.govAlignment !== null && "note" in item.govAlignment
            ? String((item.govAlignment as Record<string, unknown>).note)
            : "",
      },
    });
  }

  // Compute alignment score
  const touchedPriorities = new Set<string>();
  for (const item of validatedItems) {
    if (item.govAlignment.priority) {
      touchedPriorities.add(item.govAlignment.priority);
    }
  }

  const date = todayUTC();
  const digest: Digest = {
    date,
    generatedAt: new Date().toISOString(),
    items: validatedItems,
    alignmentScore: {
      matched: touchedPriorities.size,
      total: GOV_PRIORITIES_COUNT, // 6
    },
  };

  return digest;
}

/** Generate a short unique ID for each digest item */
function generateId(): string {
  return crypto.randomBytes(6).toString("hex");
}
