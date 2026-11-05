import "server-only";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { isProductionSite } from "../config";

export type EmailMessage = {
  to: string;
  toName?: string;
  subject: string;
  html: string;
  text: string;
  tags?: string[];
};

export type SendResult =
  | { ok: true; provider: string; messageId: string | null }
  | { ok: false; provider: string; error: string };

type Provider = "brevo" | "log" | "none";

export function emailProvider(): Provider {
  const configured = process.env.EMAIL_PROVIDER;
  if (configured === "brevo") return "brevo";
  // Le mode « log » écrit les e-mails dans un dossier local : jamais en production.
  if (configured === "log" && !isProductionSite) return "log";
  return "none";
}

export function emailProviderLabel(provider = emailProvider()) {
  if (provider === "brevo") return "Brevo";
  if (provider === "log") return "Journal de test (aucun envoi réel)";
  return "Non configuré";
}

async function sendWithBrevo(message: EmailMessage): Promise<SendResult> {
  const apiKey = process.env.BREVO_API_KEY;
  const fromAddress = process.env.EMAIL_FROM_ADDRESS;
  if (!apiKey || !fromAddress) {
    return { ok: false, provider: "brevo", error: "BREVO_API_KEY ou EMAIL_FROM_ADDRESS manquant." };
  }
  try {
    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: { "api-key": apiKey, "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify({
        sender: { name: process.env.EMAIL_FROM_NAME ?? "KALIMA", email: fromAddress },
        to: [{ email: message.to, name: message.toName || undefined }],
        replyTo: process.env.EMAIL_REPLY_TO ? { email: process.env.EMAIL_REPLY_TO } : undefined,
        subject: message.subject,
        htmlContent: message.html,
        textContent: message.text,
        tags: message.tags,
      }),
      signal: AbortSignal.timeout(15_000),
    });
    const body = (await response.json().catch(() => ({}))) as { messageId?: string; message?: string };
    if (!response.ok) {
      return { ok: false, provider: "brevo", error: `Brevo ${response.status} : ${body.message ?? "refus"}` };
    }
    return { ok: true, provider: "brevo", messageId: body.messageId ?? null };
  } catch (error) {
    return { ok: false, provider: "brevo", error: `Brevo injoignable : ${(error as Error).message}` };
  }
}

async function writeToLog(message: EmailMessage): Promise<SendResult> {
  const dir = path.join(process.cwd(), ".outbox");
  await mkdir(dir, { recursive: true });
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  await writeFile(path.join(dir, `${id}.json`), JSON.stringify(message, null, 2));
  return { ok: true, provider: "log", messageId: id };
}

export async function sendEmail(message: EmailMessage): Promise<SendResult> {
  const provider = emailProvider();
  if (provider === "brevo") return sendWithBrevo(message);
  if (provider === "log") return writeToLog(message);
  return { ok: false, provider: "none", error: "Aucun service d'e-mail n'est configuré." };
}
