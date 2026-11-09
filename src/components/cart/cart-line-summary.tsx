import type { CartLine } from "./cart-context";

export function lineDetail(line: Pick<CartLine, "formatLabel" | "units" | "unitLabel" | "supplementNames">) {
  const format = line.units ? `${line.formatLabel} · ${line.units} ${line.unitLabel ?? "pièce"}${line.units > 1 ? "s" : ""}` : line.formatLabel;
  return line.supplementNames.length ? `${format} · ${line.supplementNames.join(", ")}` : `${format} · sans supplément`;
}
