"use client";

import { MinusIcon, PlusIcon } from "./icons";

export function Stepper({
  value,
  min,
  max,
  onChange,
  label,
  size = "md",
}: {
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
  label: string;
  size?: "sm" | "md";
}) {
  const button = size === "sm" ? "size-9" : "size-11";
  return (
    <div className="inline-flex items-center rounded-full border border-line bg-white p-1" role="group" aria-label={label}>
      <button
        type="button"
        className={`${button} grid place-items-center rounded-full text-night transition hover:bg-mist disabled:opacity-35`}
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        aria-label={`Diminuer : ${label}`}
      >
        <MinusIcon />
      </button>
      <output aria-live="polite" className={`tabular display text-center ${size === "sm" ? "w-8 text-lg" : "w-11 text-xl"}`}>
        {value}
      </output>
      <button
        type="button"
        className={`${button} grid place-items-center rounded-full text-night transition hover:bg-mist disabled:opacity-35`}
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        aria-label={`Augmenter : ${label}`}
      >
        <PlusIcon />
      </button>
    </div>
  );
}
