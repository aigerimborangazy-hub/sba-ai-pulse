// ============================================================
// SBA AI Pulse — Multi-query news fetching pipeline
//
// Makes 5 parallel Perplexity Sonar Pro queries, each focused
// on a different area, then merges, deduplicates, and validates.
// This gives much better coverage than a single monolithic query.
// ============================================================
import { buildQueryPrompt, SEARCH_QUERIES } from "./prompt";
import type { Digest, DigestItem } from "./types";
import { GOV_PRIORITIES_COUNT } from "./constants";
import { todayUTC } from "./storage";
import crypto from "crypto";

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";
const MODEL = "perplexity/sonar-pro";

interface OpenRouterResponse {
  choices?: Array<{ message?: { content?: string } }>;
  error?: { message?: string };
}

// --- Single query fetcher ---
async function fetchSingleQuery(
  apiKey: string,
  query: (typeof SEARCH_QUERIES)[number]
): Promise<DigestItem[]> {
  const prompt = buildQueryPrompt(query);

  const response = await fetch(OPENROUTER_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      "HTTP-Referer": process.env.VERCEL_URL || "http://localhost:3000",
      "X-Title": "SBA AI Pulse",
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
      max_tokens: 4000,
    }),
    signal: AbortSignal.timeout(120_000),
  });

  if (!response.ok) {
    const errBody = await response.text().catch(() => "");
    console.error(`[fetch] Query ${query.id} failed: ${response.status} ${errBody}`);
    return [];
  }

  const data = (await response.json()) as OpenRouterResponse;

  if (data.error?.message) {
    console.error(`[fetch] Query ${query.id} API error: ${data.error.message}`);
    return [];
  }

  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    console.error(`[fetch] Query ${query.id} empty response`);
    return [];
  }

  // Parse JSON — strip markdown code fences if present
  const jsonStr = content
    .replace(/^```(?:json)?\s*/m, "")
    .replace(/\s*```\s*$/m, "")
    .trim();

  let parsed: { items?: unknown[] };
  try {
    parsed = JSON.parse(jsonStr);
  } catch {
    console.error(`[fetch] Query ${query.id} JSON parse failed`);
    return [];
  }

  if (!Array.isArray(parsed.items)) {
    console.error(`[fetch] Query ${query.id} no items array`);
    return [];
  }

  // Validate each item
  const items: DigestItem[] = [];

  for (const raw of parsed.items) {
    const item = raw as Record<string, unknown>;

    const sourceUrl = typeof item.sourceUrl === "string" ? item.sourceUrl.trim() : "";
    if (!sourceUrl || !sourceUrl.startsWith("http")) {
      console.warn(`[fetch] ${query.id}: dropping item without valid URL`);
      continue;
    }

    // Reject fake/placeholder URLs
    if (/example\.com|example\.org|placeholder|localhost|127\.0\.0\.1|fakeurl/i.test(sourceUrl)) {
      continue;
    }

    // Reject video/social media URLs
    if (/youtube\.com|youtu\.be|tiktok\.com|instagram\.com|facebook\.com|vk\.com|dailymotion\.com|vimeo\.com|twitch\.tv/i.test(sourceUrl)) {
      continue;
    }

    items.push({
      id: generateId(),
      title: typeof item.title === "string" ? item.title : "Без заголовка",
      summary: typeof item.summary === "string" ? item.summary : "",
      sourceUrl,
      sourceName: typeof item.sourceName === "string" ? item.sourceName : sourceUrl,
      publishedAt: typeof item.publishedAt === "string" ? item.publishedAt : "",
      industryTags: Array.isArray(item.industryTags) ? (item.industryTags as string[]) : ["Кросс-отраслевое"],
      significance:
        item.significance === "high" || item.significance === "medium" || item.significance === "low"
          ? item.significance : "medium",
      actionPoint: typeof item.actionPoint === "string" ? item.actionPoint : "",
      training: {
        recommendation:
          typeof item.training === "object" && item.training !== null && "recommendation" in item.training
            ? String((item.training as Record<string, unknown>).recommendation) : "",
        existsInCatalog:
          typeof item.training === "object" && item.training !== null && "existsInCatalog" in item.training
            ? Boolean((item.training as Record<string, unknown>).existsInCatalog) : false,
        ticketSuggested:
          typeof item.training === "object" && item.training !== null && "ticketSuggested" in item.training
            ? Boolean((item.training as Record<string, unknown>).ticketSuggested) : false,
      },
      govAlignment: {
        priority:
          typeof item.govAlignment === "object" && item.govAlignment !== null && "priority" in item.govAlignment
            ? String((item.govAlignment as Record<string, unknown>).priority) : "",
        note:
          typeof item.govAlignment === "object" && item.govAlignment !== null && "note" in item.govAlignment
            ? String((item.govAlignment as Record<string, unknown>).note) : "",
      },
    });
  }

  console.log(`[fetch] Query ${query.id}: ${items.length} valid items`);
  return items;
}

// --- Deduplication: by sourceUrl (exact) + title similarity ---
function deduplicateItems(items: DigestItem[]): DigestItem[] {
  const seen = new Map<string, DigestItem>();

  for (const item of items) {
    if (seen.has(item.sourceUrl)) continue;

    const normalizedTitle = item.title.toLowerCase().replace(/[^\wа-яё]/gi, "").trim();

    let isDuplicate = false;
    const seenEntries = Array.from(seen.values());
    for (const existing of seenEntries) {
      const existingNorm = existing.title.toLowerCase().replace(/[^\wа-яё]/gi, "").trim();
      if (
        normalizedTitle.length > 10 &&
        existingNorm.length > 10 &&
        (normalizedTitle === existingNorm ||
          normalizedTitle.includes(existingNorm) ||
          existingNorm.includes(normalizedTitle))
      ) {
        isDuplicate = true;
        break;
      }
    }

    if (!isDuplicate) seen.set(item.sourceUrl, item);
  }

  return Array.from(seen.values());
}

// --- Main pipeline: 5 parallel queries → merge → dedup → sort → cap ---
export async function fetchNewsDigest(): Promise<Digest> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error("OPENROUTER_API_KEY is not set in environment");

  console.log(`[fetch] Starting multi-query pipeline: ${SEARCH_QUERIES.length} parallel queries`);

  const results = await Promise.allSettled(
    SEARCH_QUERIES.map((query) => fetchSingleQuery(apiKey, query))
  );

  const allItems: DigestItem[] = [];
  for (let i = 0; i < results.length; i++) {
    const result = results[i];
    if (result.status === "fulfilled") {
      allItems.push(...result.value);
    } else {
      console.error(`[fetch] Query ${SEARCH_QUERIES[i].id} rejected:`, result.reason);
    }
  }

  console.log(`[fetch] Total before dedup: ${allItems.length}`);

  const deduped = deduplicateItems(allItems);
  console.log(`[fetch] After dedup: ${deduped.length}`);

  // Sort: high → medium → low
  const sorted = deduped.sort((a, b) => {
    const order = { high: 0, medium: 1, low: 2 };
    return order[a.significance] - order[b.significance];
  });

  const finalItems = sorted.slice(0, 15);

  // Compute alignment score
  const touchedPriorities = new Set<string>();
  for (const item of finalItems) {
    if (item.govAlignment.priority) touchedPriorities.add(item.govAlignment.priority);
  }

  const digest: Digest = {
    date: todayUTC(),
    generatedAt: new Date().toISOString(),
    items: finalItems,
    alignmentScore: { matched: touchedPriorities.size, total: GOV_PRIORITIES_COUNT },
  };

  return digest;
}

function generateId(): string {
  return crypto.randomBytes(6).toString("hex");
}