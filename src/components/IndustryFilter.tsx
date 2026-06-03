// ============================================================
// SBA AI Pulse — Industry Filter Tabs component
// ============================================================
"use client";

import { INDUSTRY_TAGS } from "@/lib/constants";

interface IndustryFilterProps {
  selected: string;
  onChange: (tag: string) => void;
}

export default function IndustryFilter({ selected, onChange }: IndustryFilterProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {INDUSTRY_TAGS.map((tag) => (
        <button
          key={tag}
          onClick={() => onChange(tag)}
          className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
            selected === tag
              ? "bg-teal-700 text-white shadow-sm"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          {tag}
        </button>
      ))}
    </div>
  );
}
