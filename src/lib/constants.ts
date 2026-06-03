// ============================================================
// SBA AI Pulse — Constants used by LLM prompt & UI
// ============================================================

/**
 * Government-agenda priorities tracked for alignment scoring.
 * Denominator = 6 (fixed).
 * Based on verified 2025 sources.
 */
export const GOV_PRIORITIES = [
  "Цифровизация и искусственный интеллект",
  "Год ИИ и цифровизации 2026",
  "Цифровой кодекс",
  "Smart Cargo / цифровая логистика",
  "Цифровая платформа водных ресурсов на основе ИИ",
  "ИИ в ГМК / промышленная безопасность",
] as const;

export const GOV_PRIORITIES_COUNT = GOV_PRIORITIES.length; // 6

/** All industry tags shown in the filter UI */
export const INDUSTRY_TAGS = [
  "Все",
  "Нефтегаз",
  "Транспорт",
  "Энергетика",
  "ГМК",
  "Телеком",
  "Кросс-отраслевое",
] as const;

/**
 * Samruk-Kazyna group companies — included in the LLM prompt
 * so the model knows which entities are "relevant".
 */
export const SK_COMPANIES = [
  "KazMunayGas / КазМунайГаз",
  "Kazatomprom / Казатомпром",
  "KTZ / Қазақстан Темір Жолы",
  "Samruk-Energy / Самрук-Энерго",
  "QazaqGaz / ҚазақГаз",
  "KEGOC / КОС",
  "Kazakhtelecom / Казахтелеком",
  "Kazpost / Казпочта",
  "Air Astana",
  "Tau-Ken Samruk / Тау-Кен Самрук",
] as const;

/** Official government sources for verbatim quotes */
export const GOV_SOURCES = [
  "akorda.kz",
  "primeminister.kz",
  "adilet.zan.kz",
] as const;
