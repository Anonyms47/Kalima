"use client";

import { useEffect, useState } from "react";
import { quoteAction } from "@/app/(site)/panier/actions";
import type { Quote } from "@/lib/server/quote";
import type { CartLine } from "./cart-context";

/** Demande au serveur les prix à jour du panier (seule référence fiable). */
export function useQuote(lines: CartLine[], ready: boolean) {
  const [quote, setQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(true);
  const signature = JSON.stringify(lines.map((l) => [l.productId, l.formatId, l.units, l.boxes, l.supplementIds]));

  useEffect(() => {
    if (!ready) return;
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    quoteAction(
      lines.map((l) => ({ productId: l.productId, formatId: l.formatId, units: l.units, boxes: l.boxes, supplementIds: l.supplementIds })),
    )
      .then((result) => {
        if (!cancelled) setQuote(result);
      })
      .catch(() => {
        if (!cancelled) setQuote(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature, ready]);

  return { quote, loading };
}
