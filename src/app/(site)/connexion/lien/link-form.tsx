"use client";

import Link from "next/link";
import { useActionState } from "react";
import { loginWithLinkAction } from "@/lib/actions/auth";

export function LinkForm({ token, next }: { token: string; next: string }) {
  const [state, action, pending] = useActionState(loginWithLinkAction, {});
  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="token" value={token} />
      <input type="hidden" name="next" value={next} />
      <p className="leading-relaxed text-night/80">Ce lien est personnel, valable 15 minutes et utilisable une seule fois.</p>
      {state.error ? (
        <p role="alert" className="rounded-2xl bg-danger-soft px-4 py-3 font-medium text-danger">
          {state.error}{" "}
          <Link href="/connexion" className="underline underline-offset-4">
            Se connecter par code
          </Link>
        </p>
      ) : null}
      <button type="submit" disabled={pending || !token} className="btn-primary w-full text-base">
        {pending ? "Connexion…" : "Me connecter"}
      </button>
    </form>
  );
}
