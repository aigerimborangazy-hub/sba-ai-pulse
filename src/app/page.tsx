// ============================================================
// SBA AI Pulse — Main Portal Page (/)
// ============================================================
"use client";

import { useEffect, useState, useCallback } from "react";
import Header from "@/components/Header";
import Thermometer from "@/components/Thermometer";
import IndustryFilter from "@/components/IndustryFilter";
import NewsCard from "@/components/NewsCard";
import type { Digest } from "@/lib/types";

export default function HomePage() {
  const [digest, setDigest] = useState<Digest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedIndustry, setSelectedIndustry] = useState("Все");

  const fetchDigest = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/digest");
      if (!res.ok) {
        setDigest(null);
        return;
      }
      const data: Digest = await res.json();
      setDigest(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка загрузки");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDigest();
  }, [fetchDigest]);

  const handleRefresh = async () => {
    setRefreshing(true);
    setError(null);
    try {
      const CRON_SECRET = process.env.NEXT_PUBLIC_CRON_SECRET || "";
      const res = await fetch("/api/refresh", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${CRON_SECRET}`,
        },
      });
      const data = await res.json();

      if (data.success) {
        setDigest(data.digest);
      } else {
        setError(data.error || "Ошибка при обновлении");
        if (data.fallback) {
          setDigest(data.fallback);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка при обновлении");
    } finally {
      setRefreshing(false);
    }
  };

  const filteredItems = digest
    ? selectedIndustry === "Все"
      ? digest.items
      : digest.items.filter((item) => item.industryTags.includes(selectedIndustry))
    : [];

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        lastUpdated={digest?.generatedAt ?? null}
        onRefresh={handleRefresh}
        refreshing={refreshing}
      />

      <main className="mx-auto max-w-5xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        {loading && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-700 border-t-transparent" />
            <p className="mt-4 text-sm text-gray-500">Загрузка дайджеста...</p>
          </div>
        )}

        {error && !digest && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            <p className="font-semibold">Ошибка</p>
            <p className="mt-1">{error}</p>
          </div>
        )}

        {!digest && !loading && (
          <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-white py-20">
            <p className="mb-4 text-lg font-medium text-gray-600">
              Выпуск ещё не сгенерирован
            </p>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="rounded-lg bg-teal-700 px-6 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-teal-800 disabled:opacity-50"
            >
              {refreshing ? "Генерация..." : "Сгенерировать сегодняшний выпуск"}
            </button>
            {error && (
              <p className="mt-3 text-xs text-gray-400">{error}</p>
            )}
          </div>
        )}

        {digest && !loading && (
          <>
            <Thermometer digest={digest} />
            <IndustryFilter
              selected={selectedIndustry}
              onChange={setSelectedIndustry}
            />
            {filteredItems.length === 0 ? (
              <div className="rounded-lg bg-white p-8 text-center text-sm text-gray-500">
                Нет новостей для выбранной отрасли
              </div>
            ) : (
              <div className="space-y-4">
                {filteredItems.map((item) => (
                  <NewsCard key={item.id} item={item} />
                ))}
              </div>
            )}
            {error && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                <p className="font-semibold">Примечание</p>
                <p className="mt-1">{error}</p>
                <p className="mt-1 text-xs text-amber-600">
                  Показан предыдущий выпуск от {digest.date}
                </p>
              </div>
            )}
          </>
        )}
      </main>

      <footer className="mx-auto max-w-5xl px-4 pb-6 sm:px-6 lg:px-8">
        <a href="/teaser" className="text-sm text-teal-700 hover:underline">
          Предпросмотр email-рассылки →
        </a>
      </footer>
    </div>
  );
}
