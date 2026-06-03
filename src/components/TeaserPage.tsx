// ============================================================
// SBA AI Pulse — TeaserPage component
// Email-style preview: top 3 high-significance items as one-liners.
// ============================================================
import type { Digest } from "@/lib/types";

interface TeaserPageProps {
  digest: Digest;
}

export default function TeaserPage({ digest }: TeaserPageProps) {
  // Top 3 high-significance items
  const highItems = digest.items
    .filter((i) => i.significance === "high")
    .slice(0, 3);

  // If fewer than 3 high items, fill with medium
  const teaserItems =
    highItems.length >= 3
      ? highItems
      : [...highItems, ...digest.items.filter((i) => i.significance === "medium").slice(0, 3 - highItems.length)];

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      {/* Email header */}
      <div className="mb-8 rounded-xl bg-teal-700 px-6 py-8 text-white">
        <h1 className="text-2xl font-bold">SBA AI Pulse — Утренний выпуск</h1>
        <p className="mt-1 text-sm opacity-80">
          {new Date(digest.date).toLocaleDateString("ru-RU", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
      </div>

      {/* Alignment score */}
      <div className="mb-6 rounded-lg border border-gray-200 bg-white p-4">
        <h2 className="mb-2 text-sm font-semibold text-gray-700">
          Соответствие госповестке
        </h2>
        <div className="flex items-center gap-3">
          <div className="flex-1 overflow-hidden rounded-full bg-gray-100">
            <div
              className="h-2 rounded-full bg-teal-700 transition-all"
              style={{
                width: `${Math.round((digest.alignmentScore.matched / digest.alignmentScore.total) * 100)}%`,
              }}
            />
          </div>
          <span className="text-sm font-bold text-teal-700">
            {digest.alignmentScore.matched}/{digest.alignmentScore.total}
          </span>
        </div>
      </div>

      {/* Top items */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-gray-900">Главное сегодня</h2>
        {teaserItems.map((item) => (
          <a
            key={item.id}
            href={item.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="block rounded-lg border border-gray-200 bg-white p-4 transition hover:border-teal-300 hover:shadow-sm"
          >
            <div className="flex items-start gap-3">
              <span
                className={`mt-1 h-2 w-2 shrink-0 rounded-full ${
                  item.significance === "high"
                    ? "bg-red-500"
                    : "bg-amber-400"
                }`}
              />
              <div>
                <p className="font-semibold text-gray-900">{item.title}</p>
                <p className="mt-1 text-sm text-gray-600 line-clamp-2">
                  {item.summary}
                </p>
                <p className="mt-2 text-xs text-teal-700">
                  Подробнее → {item.sourceName}
                </p>
              </div>
            </div>
          </a>
        ))}
      </div>

      {/* Footer */}
      <div className="mt-10 border-t border-gray-200 pt-6 text-center text-xs text-gray-400">
        <p>SBA AI Pulse — ежедневный дайджест для руководителей</p>
        <p className="mt-1">
          <a href="/" className="text-teal-700 hover:underline">
            Открыть полный портал →
          </a>
        </p>
      </div>
    </div>
  );
}
