"use client";

interface MetricCardProps {
  label: string;
  value: string;
  unit?: string;
  /** Optional colour hint: "green" | "red" | "amber" | "blue" | "violet" */
  tone?: "green" | "red" | "amber" | "blue" | "violet" | "gray";
  hint?: string;
}

const TONE_CLASSES: Record<NonNullable<MetricCardProps["tone"]>, string> = {
  green:  "bg-green-50  border-green-200  text-green-700",
  red:    "bg-red-50    border-red-200    text-red-700",
  amber:  "bg-amber-50  border-amber-200  text-amber-700",
  blue:   "bg-blue-50   border-blue-200   text-blue-700",
  violet: "bg-violet-50 border-violet-200 text-violet-700",
  gray:   "bg-gray-50   border-gray-200   text-gray-700",
};

export default function MetricCard({
  label,
  value,
  unit,
  tone = "gray",
  hint,
}: MetricCardProps) {
  return (
    <div
      className={`rounded-xl border p-4 card-hover ${TONE_CLASSES[tone]}`}
      title={hint}
    >
      <p className="text-xs font-semibold uppercase tracking-wide opacity-70">
        {label}
      </p>
      <p className="mt-1 text-2xl font-bold">
        {value}
        {unit && (
          <span className="ml-1 text-sm font-normal opacity-60">{unit}</span>
        )}
      </p>
      {hint && <p className="mt-1 text-xs opacity-60 leading-snug">{hint}</p>}
    </div>
  );
}
