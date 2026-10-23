"use client";

import { useActionState, useState } from "react";
import { login, signup, type AuthState } from "./actions";

const initialState: AuthState = {};

export function AuthForm() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [loginState, loginAction, loginPending] = useActionState(
    login,
    initialState,
  );
  const [signupState, signupAction, signupPending] = useActionState(
    signup,
    initialState,
  );

  const isLogin = mode === "login";
  const state = isLogin ? loginState : signupState;
  const pending = isLogin ? loginPending : signupPending;

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 rounded-full border border-foreground/10 p-1 text-sm">
        <button
          type="button"
          onClick={() => setMode("login")}
          className={`rounded-full py-2 ${isLogin ? "bg-foreground text-background" : ""}`}
        >
          Connexion
        </button>
        <button
          type="button"
          onClick={() => setMode("signup")}
          className={`rounded-full py-2 ${!isLogin ? "bg-foreground text-background" : ""}`}
        >
          Inscription
        </button>
      </div>

      <form
        action={isLogin ? loginAction : signupAction}
        className="flex flex-col gap-4"
      >
        <label className="flex flex-col gap-1 text-sm">
          E-mail
          <input
            name="email"
            type="email"
            required
            autoComplete="email"
            className="rounded-lg border border-foreground/20 bg-transparent px-3 py-2"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Mot de passe
          <input
            name="password"
            type="password"
            required
            minLength={isLogin ? undefined : 8}
            autoComplete={isLogin ? "current-password" : "new-password"}
            className="rounded-lg border border-foreground/20 bg-transparent px-3 py-2"
          />
        </label>

        {state.error && (
          <p role="alert" className="text-sm text-red-600">
            {state.error}
          </p>
        )}
        {state.message && (
          <p className="text-sm text-green-600">{state.message}</p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-foreground py-3 text-background hover:opacity-90 disabled:opacity-50"
        >
          {pending ? "Patientez…" : isLogin ? "Se connecter" : "Créer mon compte"}
        </button>
      </form>
    </div>
  );
}
