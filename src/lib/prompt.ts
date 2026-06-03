// ============================================================
// SBA AI Pulse — LLM prompt builder for news gathering
// ============================================================
import { GOV_PRIORITIES, SK_COMPANIES, GOV_SOURCES } from "./constants";

/**
 * Build the system + user prompt that instructs the Perplexity-via-OpenRouter model
 * to search for recent AI/automation news in Kazakhstan's corporate sector and return
 * strictly-formatted JSON.
 *
 * The model MUST use its web-search capability (Perplexity Sonar does this automatically).
 */
export function buildNewsPrompt(): string {
  const prioritiesList = GOV_PRIORITIES.map((p, i) => `${i + 1}. "${p}"`).join("\n");
  const companiesList = SK_COMPANIES.join(", ");
  const govSourcesList = GOV_SOURCES.join(", ");

  // Comprehensive list of reliable Kazakhstan & international news sources
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
    // Международные ИИ/тех источники (для глобальных новостей с KZ импликацией)
    "techcrunch.com", "theverge.com", "wired.com", "reuters.com",
    "bloomberg.com", "ft.com", "bbc.com", "cnbc.com",
    "zdnet.com", "arstechnica.com", "venturebeat.com",
  ].join(", ");

  return `Ты — аналитический ИИ-ассистент, который проводит мониторинг новостей за ПОСЛЕДНИЕ 7 ДНЕЙ с помощью веб-поиска.
Твоя задача: найти все значимые новости об искусственном интеллекте и автоматизации в корпоративном / квази-государственном секторе Казахстана.

## Ключевые компании группы Самрук-Казына (приоритет):
${companiesList}

## Отслеживаемые приоритеты госповестки (привяжи каждую новость к ближайшему):
${prioritiesList}

## Официальные источники государственных распоряжений:
${govSourcesList}
Если новость касается правительственного поручения или выступления Президента — процитируй текст распоряжения ДОСЛОВНО и укажи официальный источник URL. НЕ paraphrase смысл государственного поручения.

## Доверенные источники (ищи здесь прежде всего — текстовые новостные статьи, НЕ видео):
${preferredSources}

## Правила отбора:
1. ПРИОРИТЕТ: новости, касающиеся Казахстана, компаний группы Самрук-Казына ИЛИ глобальные новости об ИИ, которые требуют конкретных действий от казахстанской компании.
2. ИСКЛЮЧИ: общий глобальный хайп (например, "OpenAI выпустила модель"), если нет прямой локальной импликации.
3. Верни от 10 до 15 пунктов — чем больше релевантных новостей, тем лучше. Приоритет: Казахстан > СНГ > глобальные с KZ-импликацией.
4. Каждый пункт ОБЯЗАН иметь рабочий URL источника, начинающийся с http. Если URL недоступен — НЕ включай этот пункт.
5. Весь текст на русском языке.
6. Делай несколько поисковых запросов с разными ключевыми словами: "Казахстан ИИ", "Казахстан автоматизация", "Самрук-Казына ИИ", "Kazakhstan AI", "Kazakhstan digitalization", "Казахстан цифровизация", "КазМунайГаз ИИ", "Казатомпром автоматизация", "КТЗ цифровизация", "Казахтелеком ИИ", "KEGOC автоматизация", "QazaqGaz ИИ", "Год ИИ 2026 Казахстан", "цифровой кодекс Казахстан", "AI mining Kazakhstan", "Smart Cargo Казахстан".
7. ИСКЛЮЧИ YouTube, TikTok, Instagram, Facebook, VK видео-ссылки как sourceUrl — нужны только текстовые новостные статьи и официальные пресс-релизы. Если источником является видео — найди текстовый отчёт об этом же событии на новостном сайте.

## Формат ответа:
Верни СТРОГО JSON-объект следующей структуры (без markdown-обёртки, без дополнительного текста, без code fence):

{
  "items": [
    {
      "title": "короткий заголовок, RU",
      "summary": "2-3 предложения, нейтральный тон, RU",
      "sourceUrl": "https://... (ОБЯЗАТЕЛЬНО, должен начинаться с http, только реальный URL из поиска)",
      "sourceName": "название источника, например Tengrinews, Akorda, Kapital",
      "publishedAt": "ISO date if known, else пустая строка",
      "industryTags": ["Нефтегаз","Транспорт","Энергетика","Кросс-отраслевое","ГМК","Телеком"],
      "significance": "high или medium или low",
      "actionPoint": "1 конкретное действие для руководителя, RU",
      "training": {
        "recommendation": "что изучить / какой модуль построить, RU",
        "existsInCatalog": false,
        "ticketSuggested": false
      },
      "govAlignment": {
        "priority": "ближайший приоритет из списка выше",
        "note": "1 строка, как это соотносится, RU"
      }
    }
  ]
}

ВАЖНО:
- Каждый sourceUrl ОБЯЗАН начинаться с http и быть реальным URL найденным через веб-поиск.
- НЕ выдумывай URL. Если не можешь найти реальный URL — НЕ включай пункт.
- Если новость о государственном поручении — процитируй дословно в summary и укажи официальный URL.
- Верни ТОЛЬКО чистый JSON. Без markdown, без обёрток, без пояснений.`;
}
