import "server-only";
import { cache } from "react";
import { sql, type Db } from "./db";

export type Settings = {
  contact: {
    phone: string;
    whatsapp_number: string;
    whatsapp_link: string;
    instagram: string;
    email: string;
  };
  hours: string;
  pickup: { area: string; details: string };
  payment: { provider: "manual_link"; link: string; label: string; instructions: string };
  reservation_minutes: number;
  orders_open: boolean;
  announcement: string;
  home_note: string;
  reward_supplements_policy: "undecided" | "not_included";
  food_info: string;
  sales_terms: string;
  legal_notice: string;
};

export const DEFAULT_SETTINGS: Settings = {
  contact: { phone: "", whatsapp_number: "", whatsapp_link: "", instagram: "", email: "" },
  hours: "",
  pickup: { area: "", details: "" },
  payment: { provider: "manual_link", link: "", label: "", instructions: "" },
  reservation_minutes: 120,
  orders_open: true,
  announcement: "",
  home_note: "",
  reward_supplements_policy: "undecided",
  food_info: "",
  sales_terms: "",
  legal_notice: "",
};

async function load(db: Db): Promise<Settings> {
  const rows = await db<{ key: string; value: unknown }[]>`select key, value from settings`;
  const result: Record<string, unknown> = { ...DEFAULT_SETTINGS };
  for (const row of rows) {
    const fallback = (DEFAULT_SETTINGS as Record<string, unknown>)[row.key];
    result[row.key] =
      fallback && typeof fallback === "object" && row.value && typeof row.value === "object"
        ? { ...fallback, ...row.value }
        : row.value;
  }
  return result as Settings;
}

export const getSettings = cache(() => load(sql));

export function loadSettings(db: Db) {
  return load(db);
}

export async function saveSetting<K extends keyof Settings>(db: Db, key: K, value: Settings[K], userId: string) {
  await db`
    insert into settings (key, value, updated_at, updated_by)
    values (${key}, ${db.json(value as never)}, now(), ${userId})
    on conflict (key) do update set value = excluded.value, updated_at = now(), updated_by = excluded.updated_by`;
}
