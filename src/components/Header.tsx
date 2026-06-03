// ============================================================
// SBA AI Pulse — Header component
// ============================================================
"use client";

import { RefreshCw } from "lucide-react";

interface HeaderProps {
  lastUpdated: string | null;
  onRefresh: () => void;
  refreshing: boolean;
}

export default function Header({ lastUpdated, onRefresh, refreshing }: HeaderProps) {
  const today = new Date().toLocaleDateString("ru-RU", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <header className="border-b border-gray-200 bg-white px-4 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-5xl items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
            SBA AI Pulse
          </h1>
          <p className="mt-1 text-sm capitalize text-gray-500">{today}</p>
          {lastUpdated && (
            <p className="mt-1 text-xs text-gray-400">
              Обновлено: {new Date(lastUpdated).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}
            </p>
          )}
        </div>
        <button
          onClick={onRefresh}
          disabled={refreshing}
          className="inline-flex items-center gap-2 rounded-lg bg-teal-700 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
          {refreshing ? "Обновление..." : "Обновить"}
        </button>
      </div>
    </header>
  );
}
