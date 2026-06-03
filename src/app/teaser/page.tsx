// ============================================================
// SBA AI Pulse — Teaser Page (/teaser)
//
// Email-style preview of top 3 items.
// Client component that fetches digest and renders TeaserPage.
// ============================================================
"use client";

import { useEffect, useState } from "react";
import TeaserPage from "@/components/TeaserPage";
import type { Digest } from "@/lib/types";

export default function TeaserRoute() {
  const [digest, setDigest] = useState<Digest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDigest() {
      try {
        const res = await fetch("/api/digest");
        if (!res.ok) {
          setError("Дайджест недоступен");
          return;
        }
        const data: Digest = await res.json();
        setDigest(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Ошибка загрузки");
      } finally {
        setLoading(false);
      }
    }
    fetchDigest();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-700 border-t-transparent" />
      </div>
    );
  }

  if (error || !digest) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
          <p className="font-semibold text-red-800">Ошибка</p>
          <p className="mt-1 text-sm text-red-600">{error || "Дайджест не найден"}</p>
          <a href="/" className="mt-3 inline-block text-sm text-teal-700 hover:underline">
            ← На портал
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <TeaserPage digest={digest} />
      <div className="mx-auto max-w-2xl px-4 pb-6 text-center">
        <a href="/" className="text-sm text-teal-700 hover:underline">
          ← Открыть полный портал
        </a>
      </div>
    </div>
  );
}
