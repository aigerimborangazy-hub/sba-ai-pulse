// ============================================================
// SBA AI Pulse — Core TypeScript types
// ============================================================

export type DigestItem = {
  id: string;
  /** short headline, RU */
  title: string;
  /** 2–3 sentence AI summary, RU, neutral tone */
  summary: string;
  /** REQUIRED — must start with http */
  sourceUrl: string;
  /** e.g. "Tengrinews", "Akorda" */
  sourceName: string;
  /** ISO date if known, else "" */
  publishedAt: string;
  /** e.g. ["Нефтегаз","Транспорт","Энергетика","Кросс-отраслевое"] */
  industryTags: string[];
  significance: "high" | "medium" | "low";
  /** 1 concrete action for an executive, RU */
  actionPoint: string;
  training: {
    /** what to learn / what module to build, RU */
    recommendation: string;
    /** model's best guess; default false */
    existsInCatalog: boolean;
    /** true if no course likely exists → funnel signal */
    ticketSuggested: boolean;
  };
  govAlignment: {
    /** e.g. "Цифровизация и ИИ", "Год ИИ 2026", "Водные ресурсы" */
    priority: string;
    /** 1 line how it maps, RU */
    note: string;
  };
};

export type Digest = {
  /** YYYY-MM-DD */
  date: string;
  /** ISO timestamp */
  generatedAt: string;
  items: DigestItem[];
  alignmentScore: {
    /** count of distinct gov priorities touched today */
    matched: number;
    /** fixed denominator of tracked priorities (use 6) */
    total: number;
  };
};
