// ============================================================
// SBA AI Pulse — NewsCard component
// Displays a single DigestItem with all its enriched fields.
// ============================================================
"use client";

import type { DigestItem } from "@/lib/types";
import { ExternalLink } from "lucide-react";
import { useState } from "react";

interface NewsCardProps {
  item: DigestItem;
}

const SIG_COLORS = {
  high: "bg-red-500",
  medium: "bg-amber-400",
  low: "bg-gray-400",
};

const SIG_LABELS = {
  high: "Высокая",
  medium: "Средняя",
  low: "Низкая",
};

export default function NewsCard({ item }: NewsCardProps) {
  const [ticketLoading, setTicketLoading] = useState(false);

  const handleCreateTicket = async () => {
    setTicketLoading(true);
    try {
      const res = await fetch("/api/ticket", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itemId: item.id,
          recommendation: item.training.recommendation,
        }),
      });
      const data = await res.json();
      if (data.success) {
        alert("Тикет создан в Академию!");
      } else {
        alert("Ошибка при создании тикета");
      }
    } catch {
      alert("Ошибка при создании тикета");
    } finally {
      setTicketLoading(false);
    }
  };

  return (
    <article className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition hover:shadow-md">
      {/* Top row: significance dot + industry tags */}
      <div className="mb-3 flex items-center gap-2">
        <span className="flex items-center gap-1.5">
          <span className={`h-2.5 w-2.5 rounded-full ${SIG_COLORS[item.significance]}`} />
          <span className="text-xs font-medium text-gray-500">{SIG_LABELS[item.significance]}</span>
        </span>
        <div className="ml-auto flex flex-wrap gap-1.5">
          {item.industryTags.map((tag) => (
            <span
              key={tag}
              className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-600"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* Title */}
      <h3 className="mb-2 text-lg font-bold text-gray-900">{item.title}</h3>

      {/* Summary */}
      <p className="mb-4 text-sm leading-relaxed text-gray-600">{item.summary}</p>

      {/* Action Point */}
      <div className="mb-4 rounded-r-lg border-l-4 border-teal-600 bg-teal-50 px-4 py-3">
        <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-teal-700">
          Что делать
        </p>
        <p className="text-sm text-gray-800">{item.actionPoint}</p>
      </div>

      {/* Training */}
      {item.training.recommendation && (
        <div className="mb-4 rounded-lg bg-gray-50 px-4 py-3">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-gray-500">
            Обучение
          </p>
          <p className="text-sm text-gray-700">{item.training.recommendation}</p>
          {item.training.ticketSuggested && (
            <button
              onClick={handleCreateTicket}
              disabled={ticketLoading}
              className="mt-2 inline-flex items-center gap-1 rounded-md bg-teal-700 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-teal-800 disabled:opacity-50"
            >
              {ticketLoading ? "Создание..." : "→ Создать тикет в Академию"}
            </button>
          )}
        </div>
      )}

      {/* Gov alignment */}
      <div className="mb-4 flex items-center gap-2">
        <span className="text-xs text-gray-400">Соответствие повестке:</span>
        <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-800 ring-1 ring-inset ring-amber-600/20">
          {item.govAlignment.priority}
        </span>
      </div>

      {/* Source link */}
      <a
        href={item.sourceUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 text-sm font-medium text-teal-700 transition hover:text-teal-900"
      >
        Углубиться →
        <ExternalLink className="h-3.5 w-3.5" />
      </a>

      {/* Source meta */}
      <div className="mt-2 flex items-center gap-2 text-xs text-gray-400">
        <span>{item.sourceName}</span>
        {item.publishedAt && (
          <>
            <span>·</span>
            <span>{item.publishedAt}</span>
          </>
        )}
      </div>
    </article>
  );
}
