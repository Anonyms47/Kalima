"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { CheckoutSteps } from "@/components/checkout-steps";
import { useCart } from "@/components/cart/cart-context";
import { lineDetail } from "@/components/cart/cart-line-summary";
import { useQuote } from "@/components/cart/use-quote";
import { readPetitMot, savePetitMot } from "@/lib/petit-mot";
import { GiftIcon, PinIcon } from "@/components/icons";
import { formatPrice } from "@/lib/format";
import { placeOrderAction } from "./actions";

type Props = {
  defaults: { name: string; phone: string; email: string; referralCode: string };
  pickupArea: string;
  ordersOpen: boolean;
};

export function CheckoutForm({ defaults, pickupArea, ordersOpen }: Props) {
  const router = useRouter();
  const { lines, ready, clear } = useCart();
  const { quote, loading } = useQuote(lines, ready);
  const [fulfillment, setFulfillment] = useState<"delivery" | "pickup">("delivery");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (ready && lines.length === 0) {
    return (
      <div className="mx-auto w-full max-w-xl px-4 py-20 text-center sm:px-6">
        <h1 className="display text-4xl">Votre panier est vide</h1>
        <Link href="/gourmandises" className="btn-primary mt-8">Voir les gourmandises</Link>
      </div>
    );
  }

  function submit(formData: FormData) {
    setError(null);
    const text = (key: string) => {
      const value = String(formData.get(key) ?? "").trim();
      return value || null;
    };
    startTransition(async () => {
      const result = await placeOrderAction({
        items: lines.map((l) => ({ productId: l.productId, formatId: l.formatId, units: l.units, boxes: l.boxes, supplementIds: l.supplementIds })),
        fulfillment,
        name: text("name") ?? "",
        phone: text("phone") ?? "",
        deliveryArea: fulfillment === "delivery" ? text("deliveryArea") : null,
        note: text("note"),
        giftMessage: formData.get("wantsNote") === "custom" ? text("giftMessage") : null,
        referralCode: text("referralCode"),
      });
      if (result.ok) {
        clear();
        savePetitMot("");
        router.push(`/compte/commandes/${result.reference}?nouvelle=1`);
      } else {
        setError(result.error);
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    });
  }

  const canSubmit = ordersOpen && quote?.ok && !loading && !pending;

  return (
    <div className="mx-auto w-full max-w-5xl px-4 pt-10 pb-20 sm:px-6">
      <CheckoutSteps current={2} />
      <h1 className="display mt-3 text-4xl sm:text-5xl">Vos informations</h1>

      {error ? (
        <p role="alert" className="mt-6 rounded-2xl bg-danger-soft px-5 py-4 font-medium text-danger">
          {error}
        </p>
      ) : null}
      {!ordersOpen ? (
        <p className="mt-6 rounded-2xl bg-warning-soft px-5 py-4 font-medium text-warning">Les commandes en ligne sont momentanément fermées.</p>
      ) : null}

      <form action={submit} className="mt-8 grid gap-8 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-8">
          <section className="card space-y-5 p-6 sm:p-7">
            <h2 className="display text-2xl">Vos coordonnées</h2>
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label htmlFor="name" className="field-label">Nom</label>
                <input id="name" name="name" required autoComplete="name" defaultValue={defaults.name} className="field" />
              </div>
              <div>
                <label htmlFor="phone" className="field-label">Numéro WhatsApp</label>
                <input id="phone" name="phone" type="tel" required autoComplete="tel" inputMode="tel" defaultValue={defaults.phone} placeholder="77 123 45 67" className="field" />
              </div>
            </div>
            <p className="text-sm text-muted">
              Notifications envoyées à <strong className="text-night">{defaults.email}</strong>.
            </p>
          </section>

          <fieldset className="card space-y-4 p-6 sm:p-7">
            <legend className="sr-only">Mode de réception</legend>
            <h2 className="display text-2xl" aria-hidden>Livraison ou retrait ?</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {(
                [
                  { value: "delivery", title: "Livraison", text: "Organisée avec vous sur WhatsApp après la commande." },
                  { value: "pickup", title: "Retrait", text: pickupArea ? `À ${pickupArea}. L'adresse exacte vous est communiquée.` : "Le lieu de retrait vous est communiqué." },
                ] as const
              ).map((option) => (
                <label key={option.value} className="cursor-pointer rounded-2xl border-2 border-line p-4 transition hover:border-violet/50 has-[:checked]:border-violet has-[:checked]:bg-lilac-soft/60 has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-lilac">
                  <input type="radio" name="fulfillment" value={option.value} checked={fulfillment === option.value} onChange={() => setFulfillment(option.value)} className="sr-only" />
                  <span className="display block text-xl">{option.title}</span>
                  <span className="mt-1 block text-sm text-muted">{option.text}</span>
                </label>
              ))}
            </div>
            {fulfillment === "delivery" ? (
              <div>
                <label htmlFor="deliveryArea" className="field-label">Quartier ou zone de livraison <span className="font-normal text-muted">(facultatif)</span></label>
                <input id="deliveryArea" name="deliveryArea" className="field" placeholder="Pour préparer l'échange sur WhatsApp" />
              </div>
            ) : (
              <p className="flex items-start gap-2 rounded-xl bg-mist px-4 py-3 text-sm">
                <PinIcon className="mt-0.5 size-4 shrink-0 text-violet" /> Le moment du retrait se convient ensemble sur WhatsApp.
              </p>
            )}
          </fieldset>

          <fieldset className="card space-y-4 p-6 sm:p-7">
            <legend className="sr-only">Petit mot</legend>
            <h2 className="display flex items-center gap-2 text-2xl" aria-hidden>
              <GiftIcon className="size-6 text-violet" /> Le petit mot
            </h2>
            <GiftNoteChoice />
          </fieldset>

          <section className="card space-y-5 p-6 sm:p-7">
            <div>
              <label htmlFor="note" className="field-label">Une précision pour KALIMA ? <span className="font-normal text-muted">(facultatif)</span></label>
              <textarea id="note" name="note" rows={3} maxLength={600} className="field" />
            </div>
            <div>
              <label htmlFor="referralCode" className="field-label">Code ambassadeur <span className="font-normal text-muted">(facultatif)</span></label>
              <input id="referralCode" name="referralCode" defaultValue={defaults.referralCode} autoCapitalize="characters" className="field tabular uppercase" placeholder="Ex. KAB12CD" />
              <p className="field-hint">Le code d&apos;un proche qui vous a fait découvrir KALIMA. Il ne donne pas de réduction.</p>
            </div>
          </section>
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="card p-6">
            <h2 className="display text-2xl">Votre commande</h2>
            <ul className="mt-4 space-y-3">
              {lines.map((line, index) => (
                <li key={line.key} className="flex gap-3">
                  <div className="relative aspect-[4/5] w-12 shrink-0 overflow-hidden rounded-xl bg-mist">
                    {line.image ? <Image src={line.image} alt="" fill sizes="3rem" className="object-cover" /> : null}
                  </div>
                  <div className="min-w-0 flex-1 text-sm">
                    <p className="font-semibold">{line.boxes} × {line.name}</p>
                    <p className="text-muted">{lineDetail(line)}</p>
                    {quote?.lines[index] && !quote.lines[index].ok ? <p className="text-danger">{quote.lines[index].error}</p> : null}
                  </div>
                  <p className="tabular text-sm font-semibold">{quote?.lines[index]?.ok ? formatPrice(quote.lines[index].lineTotal) : "…"}</p>
                </li>
              ))}
            </ul>
            <div className="mt-5 flex items-baseline justify-between border-t border-line pt-4">
              <span className="font-semibold">Total à payer</span>
              <span className="display tabular text-3xl">{quote ? formatPrice(quote.total) : "…"}</span>
            </div>
            <p className="mt-4 rounded-xl bg-kraft-soft px-4 py-3 text-sm leading-relaxed font-medium text-kraft-deep">
              Livraison non comprise. Les modalités seront convenues sur WhatsApp après votre commande.
            </p>
            <p className="mt-3 text-sm text-muted">
              Paiement intégral. Après validation, vous recevez les instructions de paiement ; la commande est confirmée dès que KALIMA a vérifié sa réception.
            </p>
            <button type="submit" disabled={!canSubmit} className="btn-primary mt-5 w-full text-base">
              {pending ? "Enregistrement…" : "Valider ma commande"}
            </button>
            <Link href="/panier" className="mt-3 block text-center text-sm font-semibold text-violet hover:underline">
              Modifier le panier
            </Link>
          </div>
        </aside>
      </form>
    </div>
  );
}

function GiftNoteChoice() {
  const [mode, setMode] = useState<"kalima" | "custom">("kalima");
  // Un mot écrit sur l'accueil est repris ici.
  const [draft, setDraft] = useState("");
  useEffect(() => {
    const saved = readPetitMot();
    if (!saved) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDraft(saved);
    setMode("custom");
  }, []);
  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2">
        {(
          [
            { value: "kalima", title: "KALIMA choisit le mot", text: "On s'en occupe avec plaisir." },
            { value: "custom", title: "J'écris mon message", text: "Pour souhaiter, remercier, surprendre…" },
          ] as const
        ).map((option) => (
          <label key={option.value} className="cursor-pointer rounded-2xl border-2 border-line p-4 transition hover:border-violet/50 has-[:checked]:border-violet has-[:checked]:bg-lilac-soft/60 has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-lilac">
            <input type="radio" name="wantsNote" value={option.value} checked={mode === option.value} onChange={() => setMode(option.value)} className="sr-only" />
            <span className="block font-semibold">{option.title}</span>
            <span className="mt-1 block text-sm text-muted">{option.text}</span>
          </label>
        ))}
      </div>
      {mode === "custom" ? (
        <div className="note-card rotate-[-0.6deg]">
          <label htmlFor="giftMessage" className="sr-only">Votre petit mot</label>
          <textarea
            id="giftMessage"
            name="giftMessage"
            rows={3}
            maxLength={300}
            required
            defaultValue={draft}
            className="hand w-full resize-none bg-transparent text-[1.55rem] leading-[2rem] text-violet placeholder:text-violet/45 focus:outline-none"
            placeholder="Joyeux anniversaire Fatou !"
          />
        </div>
      ) : null}
    </>
  );
}
