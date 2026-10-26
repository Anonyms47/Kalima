"use server";

import { z } from "zod";
import type { CartLineInput } from "@/lib/server/orders";
import { quoteCart, type Quote } from "@/lib/server/quote";

const lineSchema = z.object({
  productId: z.string().max(64),
  formatId: z.string().max(64),
  units: z.number().int().nullable(),
  boxes: z.number().int(),
  supplementIds: z.array(z.string().max(64)).max(20),
});

export async function quoteAction(lines: CartLineInput[]): Promise<Quote> {
  const parsed = z.array(lineSchema).max(20).safeParse(lines);
  if (!parsed.success) return { lines: [], total: 0, ok: false };
  return quoteCart(parsed.data);
}
