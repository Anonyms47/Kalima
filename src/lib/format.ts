import { TIME_ZONE } from "./config";

const fcfa = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 });

/** 2000 → « 2 000 FCFA » (espace insécable fine remplacée par une espace normale). */
export function formatPrice(amount: number) {
  return `${fcfa.format(amount).replace(/ /g, " ")} FCFA`;
}

export function formatDate(value: Date | string, withTime = true) {
  const date = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat("fr-FR", {
    timeZone: TIME_ZONE,
    day: "numeric",
    month: "long",
    year: withTime ? undefined : "numeric",
    hour: withTime ? "2-digit" : undefined,
    minute: withTime ? "2-digit" : undefined,
  }).format(date);
}

export function formatDay(value: Date | string) {
  const date = typeof value === "string" ? new Date(`${value.slice(0, 10)}T12:00:00Z`) : value;
  return new Intl.DateTimeFormat("fr-FR", {
    timeZone: TIME_ZONE,
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

export function plural(count: number, singular: string, pluralForm = `${singular}s`) {
  return `${count} ${count > 1 ? pluralForm : singular}`;
}
