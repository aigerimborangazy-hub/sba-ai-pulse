// ============================================================
// SBA AI Pulse — Multi-query LLM prompt builder
//
// Instead of one monolithic prompt, we split into focused search
// queries that each target a specific area. This dramatically
// improves coverage because Perplexity Sonar searches differently
// for each query.
// ============================================================
import { GOV_PRIORITIES, SK_COMPANIES, GOV_SOURCES } from "./constants";

const prioritiesList = GOV_PRIORITIES.map((p, i) => `${i + 1}. "${p}"`).join("\n");
const companiesList = SK_COMPANIES.join(", ");
const govSourcesList = GOV_SOURCES.join(", ");

const preferredSources = [
  // Казахстанские новостные сайты
  "kapital.kz", "kursiv.media", "tengrinews.kz", "zakon.kz",
  "inbusiness.kz", "kazpravda.kz", "informburo.kz", "forbes.kz",
  "khabar.kz", "24.kz", "kazmonitor.com", "liter.kz",
  "nr.gov.kz", "mid.gov.kz", "kaztel.kz",
  // Официальные государственные источники
  "akorda.kz", "primeminister.kz", "adilet.zan.kz", "gov.kz",
  // Корпоративные сайты группы СК
  "kmg.kz", "kazatomprom.kz", "ktz.kz", "samruk-energy.kz",
  "qazaqgaz.kz", "kegoc.kz", "kazakhtelecom.kz", "kazpost.kz",
  "airastana.com", "tauken-samruk.kz",
  // Международные ИИ/тех источники
  "techcrunch.com", "theverge.com", "wired.com", "reuters.com",
  "bloomberg.com", "ft.com", "bbc.com", "cnbc.com",
  "zdnet.com", "arstechnica.com", "venturebeat.com",
].join(", ");

/**
 * Each query targets a specific area for better search coverage.
 * Perplexity Sonar does a fresh web search per query, so splitting
 * into focused queries yields more diverse and relevant results.
 */
export const SEARCH_QUERIES = [
  {
    id: "kz-ai-general",
    focus: "Казахстан ИИ и цифровизация — общие новости",
    keywords: "Казахстан ИИ, Казахстан цифровизация, Казахстан автоматизация, Год ИИ 2026 Казахстан, Казахстан искусственный интеллект, Казахстан робототехника",
  },
  {
    id: "sk-companies",
    focus: "Компании группы Самрук-Казына — ИИ проекты и цифровизация",
    keywords: "КазМунайГаз ИИ, Казатомпром автоматизация, КТЗ цифровизация, Казахтелеком ИИ, KEGOC автоматизация, QazaqGaz ИИ, Samruk-Energy цифровизация, Kazpost ИИ, Air Astana автоматизация, Tau-Ken Samruk ИИ, Самрук-Казына ИИ проекты",
  },
  {
    id: "gov-policy",
    focus: "Государственная политика — послания, кодексы, поручения",
    keywords: "Послание Президента Казахстан ИИ, Цифровой кодекс Казахстан, Казахстан цифровизация политика, akorda.kz ИИ, primeminister.kz цифровизация, Казахстан госпрограмма ИИ, Smart Cargo Казахстан, водные ресурсы ИИ Казахстан",
  },
  {
    id: "industry-specific",
    focus: "Отраслевые ИИ-решения — нефтегаз, ГМК, транспорт, энергетика",
    keywords: "Kazakhstan AI oil gas, Kazakhstan AI mining, AI энергетика Казахстан, Казахстан ИИ транспорт, Казахстан ИИ телеком, Казахстан промышленная безопасность ИИ, Казахстан предиктивная аналитика, Казахстан дроны ИИ",
  },
  {
    id: "global-with-kz",
    focus: "Глобальные ИИ-новости с импликацией для Казахстана",
    keywords: "AI regulation 2026, AI corporate adoption 2026, AI emerging markets, AI central Asia, generative AI enterprise 2026, AI compliance governance 2026, Kazakhstan AI adoption global context",
  },
];

/**
 * Build a focused prompt for a single search query.
 * Each query returns 3-5 items max to keep responses manageable.
 */
export function buildQueryPrompt(query: (typeof SEARCH_QUERIES)[number]): string {
  return `Ты — аналитический ИИ-ассистент. Ищи новости за ПОСЛЕДНИЕ 7 ДНЕЙ с помощью веб-поиска.

Фокус поиска: ${query.focus}

Ключевые слова для поиска: ${query.keywords}

## Ключевые компании группы Самрук-Казына:
${companiesList}

## Отслеживаемые приоритеты госповестки:
${prioritiesList}

## Официальные источники гос. распоряжений:
${govSourcesList}
Если новость касается гос. поручения — процитируй ДОСЛОВНО и укажи официальный URL.

## Доверенные источники (ищи здесь — текстовые статьи, НЕ видео):
${preferredSources}

## Правила:
1. ПРИОРИТЕТ: новости Казахстана и СК-компаний, ИЛИ глобальные с KZ-импликацией.
2. ИСКЛЮЧИ: общий глобальный хайп без локальной импликации.
3. Верни от 3 до 5 самых значимых пунктов для этого фокуса.
4. Каждый пункт ОБЯЗАН иметь реальный URL источника (http...). НЕ выдумывай URL.
5. ИСКЛЮЧИ YouTube, TikTok, Instagram, Facebook, VK ссылки — только текстовые статьи.
6. Весь текст на русском языке.

## Формат ответа:
Верни СТРОГО JSON (без markdown, без code fence):

{
  "items": [
    {
      "title": "короткий заголовок, RU",
      "summary": "2-3 предложения, нейтральный тон, RU",
      "sourceUrl": "https://... (реальный URL из поиска)",
      "sourceName": "название источника",
      "publishedAt": "ISO date или пустая строка",
      "industryTags": ["Нефтегаз","Транспорт","Энергетика","Кросс-отраслевое","ГМК","Телеком"],
      "significance": "high/medium/low",
      "actionPoint": "1 конкретное действие для руководителя, RU",
      "training": {
        "recommendation": "что изучить, RU",
        "existsInCatalog": false,
        "ticketSuggested": false
      },
      "govAlignment": {
        "priority": "ближайший приоритет из списка",
        "note": "1 строка как это соотносится, RU"
      }
    }
  ]
}

ТОЛЬКО чистый JSON. Без обёрток.`;
}