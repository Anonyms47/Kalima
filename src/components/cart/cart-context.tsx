"use client";

import { createContext, use, useCallback, useEffect, useMemo, useState, type ReactNode } from "react";

/** Ligne de panier. Les prix affichés sont indicatifs : le serveur recalcule tout. */
export type CartLine = {
  key: string;
  productId: string;
  slug: string;
  name: string;
  image: string | null;
  formatId: string;
  formatLabel: string;
  units: number | null;
  unitLabel: string | null;
  supplementIds: string[];
  supplementNames: string[];
  boxes: number;
  boxPrice: number;
};

type CartContextValue = {
  lines: CartLine[];
  ready: boolean;
  count: number;
  add: (line: Omit<CartLine, "key">) => void;
  setBoxes: (key: string, boxes: number) => void;
  remove: (key: string) => void;
  /** Remet une ligne retirée à sa place (bouton « Annuler »). */
  restore: (line: CartLine, index: number) => void;
  clear: () => void;
  lastAdded: number;
};

const STORAGE_KEY = "kalima-panier-v1";
const CartContext = createContext<CartContextValue | null>(null);

export function lineKey(line: Pick<CartLine, "productId" | "formatId" | "units" | "supplementIds">) {
  return [line.productId, line.formatId, line.units ?? "", [...line.supplementIds].sort().join("+")].join("|");
}

function read(): CartLine[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as CartLine[]) : [];
    return Array.isArray(parsed) ? parsed.filter((l) => l && typeof l.productId === "string") : [];
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [ready, setReady] = useState(false);
  const [lastAdded, setLastAdded] = useState(0);

  useEffect(() => {
    // Lecture différée : le stockage local n'existe pas au rendu serveur.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLines(read());
    setReady(true);
    const onStorage = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY) setLines(read());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const persist = useCallback((next: CartLine[]) => {
    setLines(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Navigation privée ou stockage plein : le panier reste en mémoire.
    }
  }, []);

  const value = useMemo<CartContextValue>(
    () => ({
      lines,
      ready,
      lastAdded,
      count: lines.reduce((sum, l) => sum + l.boxes, 0),
      add(line) {
        const key = lineKey(line);
        const existing = lines.find((l) => l.key === key);
        persist(
          existing
            ? lines.map((l) => (l.key === key ? { ...l, boxes: Math.min(l.boxes + line.boxes, 30), boxPrice: line.boxPrice } : l))
            : [...lines, { ...line, key }],
        );
        setLastAdded(Date.now());
      },
      setBoxes(key, boxes) {
        persist(lines.map((l) => (l.key === key ? { ...l, boxes: Math.max(1, Math.min(30, boxes)) } : l)));
      },
      remove(key) {
        persist(lines.filter((l) => l.key !== key));
      },
      restore(line, index) {
        if (lines.some((l) => l.key === line.key)) return;
        const next = [...lines];
        next.splice(Math.min(index, next.length), 0, line);
        persist(next);
      },
      clear() {
        persist([]);
      },
    }),
    [lines, ready, lastAdded, persist],
  );

  return <CartContext value={value}>{children}</CartContext>;
}

export function useCart() {
  const value = use(CartContext);
  if (!value) throw new Error("useCart doit être utilisé dans CartProvider");
  return value;
}
