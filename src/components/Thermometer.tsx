// ============================================================
// SBA AI Pulse — Alignment Thermometer component
// Shows how many of the 6 tracked gov priorities were touched today.
// ============================================================
import { GOV_PRIORITIES } from "@/lib/constants";
import type { Digest } from "@/lib/types";

interface ThermometerProps {
  digest: Digest;
}

export default function Thermometer({ digest }: ThermometerProps) {
  const { matched, total } = digest.alignmentScore;
  const pct = Math.round((matched / total) * 100);

  // Collect which priorities were actually touched
  const touchedSet = new Set(digest.items.map((i) => i.govAlignment.priority));

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-5">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">
          Соответствие госповестке
        </h2>
        <span className="text-sm font-medium text-teal-700">
          {matched} / {total} ({pct}%)
        </span>
      </div>

      {/* Bar */}
      <div className="mb-4 h-3 w-full overflow-hidden rounded-full bg-gray-100">
        <div
          className="h-full rounded-full bg-teal-700 transition-all duration-700"
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Priority chips */}
      <div className="flex flex-wrap gap-2">
        {GOV_PRIORITIES.map((priority) => {
          const touched = touchedSet.has(priority);
          return (
            <span
              key={priority}
              className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium transition ${
                touched
                  ? "bg-teal-50 text-teal-800 ring-1 ring-inset ring-teal-600/20"
                  : "bg-gray-50 text-gray-400 ring-1 ring-inset ring-gray-200"
              }`}
            >
              <span
                className={`mr-1.5 h-2 w-2 rounded-full ${
                  touched ? "bg-teal-500" : "bg-gray-300"
                }`}
              />
              {priority}
            </span>
          );
        })}
      </div>
    </section>
  );
}
