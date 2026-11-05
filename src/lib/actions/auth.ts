"use server";

import { redirect } from "next/navigation";
import { consumeLoginLink, requestLoginCode, safeNext, signOut, verifyLoginCode } from "@/lib/server/auth";

export type LoginState = { step: "email" | "code"; email: string; error?: string; info?: string; sentAt?: number };

export async function requestCodeAction(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim();
  const result = await requestLoginCode(email);
  if (!result.ok) return { step: "email", email, error: result.error };
  return { step: "code", email: email.toLowerCase(), info: `Un code à 6 chiffres vient d'être envoyé à ${email.toLowerCase()}.`, sentAt: Date.now() };
}

export async function verifyCodeAction(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") ?? "");
  const code = String(formData.get("code") ?? "");
  const next = safeNext(String(formData.get("next") ?? ""), "/compte");
  if (formData.get("intent") === "resend") {
    const result = await requestLoginCode(email);
    return result.ok
      ? { step: "code", email, info: "Un nouveau code vient d'être envoyé.", sentAt: Date.now() }
      : { step: "code", email, error: result.error };
  }
  const result = await verifyLoginCode(email, code);
  if (!result.ok) return { step: "code", email, error: result.error };
  redirect(next);
}

export async function loginWithLinkAction(_prev: { error?: string }, formData: FormData): Promise<{ error?: string }> {
  const result = await consumeLoginLink(String(formData.get("token") ?? ""));
  if (!result.ok) return { error: result.error };
  redirect(safeNext(String(formData.get("next") ?? ""), "/compte"));
}

export async function signOutAction() {
  await signOut();
  redirect("/");
}
