"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { requestCodeAction, verifyCodeAction, type LoginState } from "@/lib/actions/auth";
import { ScribbleEnvelope } from "./doodles";
import { ArrowIcon, BackIcon, CheckIcon } from "./icons";

const initial: LoginState = { step: "email", email: "" };
const CODE_LENGTH = 6;
const RESEND_DELAY = 30;

/** Six cases pour le code, portées par un seul champ (saisie, collage et remplissage automatique). */
function CodeInput({ invalid, describedBy, onComplete }: { invalid: boolean; describedBy?: string; onComplete: () => void }) {
  const [value, setValue] = useState("");
  const [focused, setFocused] = useState(true);
  return (
    <div className="relative">
      <div aria-hidden className="grid grid-cols-6 gap-2 sm:gap-2.5">
        {Array.from({ length: CODE_LENGTH }, (_, i) => {
          const current = focused && (i === value.length || (i === CODE_LENGTH - 1 && value.length === CODE_LENGTH));
          return (
            <span
              key={i}
              className={`display grid aspect-[4/5] place-items-center rounded-xl border-2 text-3xl transition ${i % 2 ? "rotate-[1.5deg]" : "-rotate-[1.5deg]"} ${
                invalid
                  ? "border-danger/60 bg-white"
                  : current
                    ? "border-violet bg-white ring-4 ring-lilac/50"
                    : value[i]
                      ? "border-night/25 bg-white text-night"
                      : "border-dashed border-kraft/70 bg-kraft-soft/40"
              }`}
            >
              {value[i] ?? (current ? <span className="h-7 w-0.5 animate-pulse rounded-full bg-violet" /> : null)}
            </span>
          );
        })}
      </div>
      <input
        id="code"
        name="code"
        inputMode="numeric"
        autoComplete="one-time-code"
        pattern="[0-9]*"
        required
        autoFocus
        value={value}
        onChange={(event) => {
          // Pas de maxLength : un collage « Code : 123456 » doit arriver entier avant d'être filtré.
          const digits = event.target.value.replace(/\D/g, "").slice(0, CODE_LENGTH);
          setValue(digits);
          if (digits.length === CODE_LENGTH) onComplete();
        }}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        aria-invalid={invalid}
        aria-describedby={describedBy}
        className="absolute inset-0 h-full w-full cursor-text text-transparent caret-transparent opacity-0 selection:bg-transparent"
      />
    </div>
  );
}

function Steps({ current }: { current: 1 | 2 }) {
  return (
    <ol className="mb-6 flex items-center gap-2.5" aria-label={`Étape ${current} sur 2`}>
      {["e-mail", "code"].map((label, index) => {
        const step = index + 1;
        const done = step < current;
        const active = step === current;
        return (
          <li key={label} className="flex items-center gap-2" aria-current={active ? "step" : undefined}>
            <span
              className={`display grid size-7 place-items-center rounded-full text-xs ${
                active ? "bg-night text-white" : done ? "-rotate-12 border-2 border-violet text-violet" : "border-2 border-dashed border-night/25 text-muted"
              }`}
            >
              {done ? <CheckIcon className="size-3.5" /> : step}
            </span>
            <span className={`hand text-xl ${active ? "text-night" : done ? "text-violet" : "text-muted"}`}>{label}</span>
            {step < 2 ? <span aria-hidden className="w-8 border-t-2 border-dotted border-kraft/60" /> : null}
          </li>
        );
      })}
    </ol>
  );
}

/** Étape du code : remontée à chaque nouvel envoi depuis le premier formulaire. */
function CodeStep({ email, next, onEdit }: { email: string; next: string; onEdit: () => void }) {
  const [state, verifyCode, verifying] = useActionState(verifyCodeAction, { step: "code", email } as LoginState);
  const form = useRef<HTMLFormElement>(null);

  // Un nouveau code ne peut être redemandé qu'après un court délai.
  const [cooldown, setCooldown] = useState(RESEND_DELAY);
  const [lastSent, setLastSent] = useState(state.sentAt);
  if (state.sentAt !== lastSent) {
    setLastSent(state.sentAt);
    setCooldown(RESEND_DELAY);
  }
  const counting = cooldown > 0;
  useEffect(() => {
    if (!counting) return;
    const timer = window.setInterval(() => setCooldown((s) => Math.max(0, s - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [counting]);

  return (
    <form ref={form} action={verifyCode} className="space-y-5" noValidate>
      <Steps current={2} />
      <input type="hidden" name="email" value={email} />
      <input type="hidden" name="next" value={next} />
      <div>
        <p className="hand flex items-center gap-2 text-2xl text-violet">
          <ScribbleEnvelope className="h-8 w-11 shrink-0 text-kraft-deep" /> un petit mot vous attend
        </p>
        <label htmlFor="code" className="display mt-2 block text-2xl">Entrez le code reçu</label>
        <p className="mt-1.5 text-sm text-muted">
          Envoyé à <strong className="text-night [overflow-wrap:anywhere]">{email}</strong>{" "}
          <button type="button" onClick={onEdit} className="inline-flex items-center gap-1 font-semibold whitespace-nowrap text-violet hover:underline">
            <BackIcon className="size-3.5" /> Modifier
          </button>
        </p>
      </div>
      <CodeInput
        key={`${state.error ?? ""}|${state.sentAt ?? ""}`}
        invalid={Boolean(state.error)}
        describedBy={state.error ? "code-error code-hint" : "code-hint"}
        onComplete={() => window.setTimeout(() => form.current?.requestSubmit(), 120)}
      />
      <p id="code-hint" className="text-sm text-muted">Valable 10 minutes. Pensez à regarder dans les courriers indésirables.</p>
      {state.error ? (
        <p id="code-error" role="alert" className="rounded-xl bg-danger-soft px-4 py-3 text-sm font-medium text-danger">{state.error}</p>
      ) : state.info ? (
        <p role="status" className="rounded-xl bg-success-soft px-4 py-3 text-sm font-medium text-success">{state.info}</p>
      ) : null}
      <button type="submit" name="intent" value="verify" disabled={verifying} className="btn-primary w-full">
        {verifying ? "Vérification…" : "Me connecter"}
      </button>
      <p className="text-center text-sm text-muted">
        Rien reçu ?{" "}
        <button
          type="submit"
          name="intent"
          value="resend"
          formNoValidate
          disabled={verifying || counting}
          className="font-semibold text-violet hover:underline disabled:cursor-not-allowed disabled:text-muted disabled:no-underline"
        >
          {counting ? `Renvoyer un code dans ${cooldown} s` : "Renvoyer un code"}
        </button>
      </p>
    </form>
  );
}

export function LoginForm({ next = "/compte", submitLabel = "Recevoir mon code" }: { next?: string; submitLabel?: string }) {
  const [emailState, requestCode, requesting] = useActionState(requestCodeAction, initial);
  // « Modifier l'adresse » ramène au premier formulaire, adresse préremplie.
  const [editing, setEditing] = useState(false);
  const [seenSentAt, setSeenSentAt] = useState(emailState.sentAt);
  if (emailState.sentAt !== seenSentAt) {
    setSeenSentAt(emailState.sentAt);
    setEditing(false);
  }

  if (emailState.step === "code" && !editing) {
    return <CodeStep key={emailState.sentAt} email={emailState.email} next={next} onEdit={() => setEditing(true)} />;
  }

  return (
    <form action={requestCode} className="space-y-4" noValidate>
      <Steps current={1} />
      <div>
        <label htmlFor="email" className="field-label">Votre adresse e-mail</label>
        <input
          id="email"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          autoCapitalize="none"
          spellCheck={false}
          required
          autoFocus={editing}
          defaultValue={emailState.email}
          className="field text-lg"
          placeholder="vous@exemple.com"
          aria-invalid={Boolean(emailState.error)}
          aria-describedby={emailState.error ? "email-error" : "email-hint"}
        />
        <p id="email-hint" className="field-hint">Nous vous envoyons un code à 6 chiffres : pas de mot de passe à retenir.</p>
      </div>
      {emailState.error ? (
        <p id="email-error" role="alert" className="rounded-xl bg-danger-soft px-4 py-3 text-sm font-medium text-danger">{emailState.error}</p>
      ) : null}
      <button type="submit" disabled={requesting} className="btn-primary w-full">
        {requesting ? "Envoi du code…" : submitLabel}
        {requesting ? null : <ArrowIcon />}
      </button>
    </form>
  );
}
