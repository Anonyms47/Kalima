"use client";

import { useActionState } from "react";
import { requestCodeAction, verifyCodeAction, type LoginState } from "@/lib/actions/auth";

const initial: LoginState = { step: "email", email: "" };

export function LoginForm({ next = "/compte", submitLabel = "Recevoir mon code" }: { next?: string; submitLabel?: string }) {
  const [emailState, requestCode, requesting] = useActionState(requestCodeAction, initial);
  const [codeState, verifyCode, verifying] = useActionState(verifyCodeAction, initial);

  // Après l'envoi du code, l'état de vérification prend le relais.
  const onCodeStep = emailState.step === "code";
  const state = codeState.email ? codeState : emailState;
  const email = codeState.email || emailState.email;

  if (!onCodeStep) {
    return (
      <form action={requestCode} className="space-y-4" noValidate>
        <div>
          <label htmlFor="email" className="field-label">Adresse e-mail</label>
          <input
            id="email"
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            required
            defaultValue={emailState.email}
            className="field"
            placeholder="vous@exemple.com"
            aria-invalid={Boolean(emailState.error)}
            aria-describedby={emailState.error ? "email-error" : "email-hint"}
          />
          <p id="email-hint" className="field-hint">Nous vous envoyons un code : pas de mot de passe à retenir.</p>
        </div>
        {emailState.error ? (
          <p id="email-error" role="alert" className="rounded-xl bg-danger-soft px-4 py-3 text-sm font-medium text-danger">{emailState.error}</p>
        ) : null}
        <button type="submit" disabled={requesting} className="btn-primary w-full">
          {requesting ? "Envoi du code…" : submitLabel}
        </button>
      </form>
    );
  }

  return (
    <form action={verifyCode} className="space-y-4" noValidate>
      <input type="hidden" name="email" value={email} />
      <input type="hidden" name="next" value={next} />
      {state.info && !state.error ? <p role="status" className="rounded-xl bg-success-soft px-4 py-3 text-sm font-medium text-success">{state.info}</p> : null}
      <div>
        <label htmlFor="code" className="field-label">Code reçu par e-mail</label>
        <input
          id="code"
          name="code"
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="[0-9]*"
          maxLength={6}
          required
          autoFocus
          className="field tabular text-center text-2xl tracking-[0.5em]"
          placeholder="••••••"
          aria-invalid={Boolean(state.error)}
          aria-describedby={state.error ? "code-error" : undefined}
        />
        <p className="field-hint">Valable 10 minutes. Pensez à vérifier vos courriers indésirables.</p>
      </div>
      {state.error ? (
        <p id="code-error" role="alert" className="rounded-xl bg-danger-soft px-4 py-3 text-sm font-medium text-danger">{state.error}</p>
      ) : null}
      <button type="submit" name="intent" value="verify" disabled={verifying} className="btn-primary w-full">
        {verifying ? "Vérification…" : "Me connecter"}
      </button>
      <button type="submit" name="intent" value="resend" formNoValidate disabled={verifying} className="w-full text-sm font-semibold text-violet hover:underline">
        Renvoyer un code à {email}
      </button>
    </form>
  );
}
