import type { Metadata } from "next";
import { cookies } from "next/headers";
import { CheckoutSteps } from "@/components/checkout-steps";
import { LoginForm } from "@/components/login-form";
import { getCurrentUser } from "@/lib/server/auth";
import { getSettings } from "@/lib/server/settings";
import { CheckoutForm } from "./checkout-form";

export const metadata: Metadata = { title: "Ma commande" };

export default async function CheckoutPage() {
  const [user, settings, jar] = await Promise.all([getCurrentUser(), getSettings(), cookies()]);

  if (!user) {
    return (
      <div data-hide-footer-cta className="mx-auto w-full max-w-xl px-4 py-14 sm:px-6">
        <CheckoutSteps current={2} />
        <h1 className="display mt-5 text-4xl sm:text-5xl">Vérifions votre e-mail</h1>
        <p className="mt-3 text-lg text-muted">
          Nous y enverrons la confirmation et le suivi de votre commande. Un code suffit, pas de mot de passe.
        </p>
        <div className="card mt-8 p-6 sm:p-8">
          <LoginForm next="/commande" submitLabel="Continuer" />
        </div>
      </div>
    );
  }

  return (
    <CheckoutForm
      defaults={{
        name: [user.firstName, user.lastName].filter(Boolean).join(" "),
        phone: user.phone ?? "",
        email: user.email,
        referralCode: jar.get("kalima_ref")?.value ?? "",
      }}
      pickupArea={settings.pickup.area}
      ordersOpen={settings.orders_open}
    />
  );
}
