import "server-only";
import { createHash, createHmac, randomBytes, randomInt, timingSafeEqual } from "node:crypto";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { appUrl, isProductionSite } from "../config";
import { renderLoginCodeEmail } from "../emails/templates";
import { whatsappUrl } from "../whatsapp";
import { sql } from "./db";
import { sendEmail } from "./email";
import { rateLimit } from "./rate-limit";
import { getSettings } from "./settings";

const SESSION_COOKIE = "kalima_session";
const SESSION_DAYS = 30;
const CODE_MINUTES = 10;
const MAX_CODE_ATTEMPTS = 5;

export type CurrentUser = {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  staff: { displayName: string; role: "owner" | "manager" } | null;
};

function secret() {
  const value = process.env.SESSION_SECRET;
  if (!value || value.length < 32) {
    throw new Error("SESSION_SECRET doit contenir au moins 32 caractères.");
  }
  return value;
}

function hashCode(email: string, code: string) {
  return createHmac("sha256", secret()).update(`${email.toLowerCase()}:${code}`).digest("hex");
}

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

async function clientIp() {
  const h = await headers();
  return (h.get("x-forwarded-for")?.split(",")[0] ?? h.get("x-real-ip") ?? "inconnue").trim();
}

export type RequestCodeResult = { ok: true } | { ok: false; error: string };

/** Envoie un code à 6 chiffres. Le code n'est conservé que sous forme hachée. */
export async function requestLoginCode(rawEmail: string): Promise<RequestCodeResult> {
  const email = normalizeEmail(rawEmail);
  if (!EMAIL_PATTERN.test(email)) return { ok: false, error: "Adresse e-mail invalide." };

  const ip = await clientIp();
  const allowed =
    (await rateLimit(`code:email:${email}`, 5, 15 * 60)) && (await rateLimit(`code:ip:${ip}`, 20, 60 * 60));
  if (!allowed) {
    return { ok: false, error: "Trop de demandes. Patientez quelques minutes avant de réessayer." };
  }

  const code = randomInt(0, 1_000_000).toString().padStart(6, "0");
  const settings = await getSettings();
  const email_ = renderLoginCodeEmail(code, {
    appUrl: appUrl(),
    contactPhone: settings.contact.phone,
    instagram: settings.contact.instagram,
    snapchat: settings.contact.snapchat,
    whatsappUrl: whatsappUrl(settings.contact.whatsapp_number),
  });

  // Les codes précédents de cette adresse ne sont plus valables.
  await sql`update login_codes set consumed_at = now() where email = ${email} and consumed_at is null`;
  await sql`
    insert into login_codes (email, code_hash, expires_at, ip)
    values (${email}, ${hashCode(email, code)}, now() + make_interval(mins => ${CODE_MINUTES}), ${ip})`;

  const result = await sendEmail({ to: email, ...email_, tags: ["connexion"] });
  if (!result.ok) {
    if (process.env.NODE_ENV === "development" && !isProductionSite) {
      console.info(`[dev] Code de connexion pour ${email} : ${code}`);
      return { ok: true };
    }
    console.error("Envoi du code impossible :", result.error);
    return { ok: false, error: "Nous n'avons pas pu envoyer le code pour le moment. Réessayez plus tard ou contactez-nous." };
  }
  return { ok: true };
}

export type VerifyCodeResult = { ok: true; userId: string } | { ok: false; error: string };

export async function verifyLoginCode(rawEmail: string, rawCode: string): Promise<VerifyCodeResult> {
  const email = normalizeEmail(rawEmail);
  const code = rawCode.replace(/\D/g, "");
  if (code.length !== 6) return { ok: false, error: "Le code contient 6 chiffres." };

  const [row] = await sql<{ id: string; code_hash: string; attempts: number }[]>`
    update login_codes set attempts = attempts + 1
    where id = (
      select id from login_codes
      where email = ${email} and consumed_at is null and expires_at > now()
      order by created_at desc limit 1
    )
    returning id, code_hash, attempts`;

  if (!row) return { ok: false, error: "Code expiré. Demandez-en un nouveau." };
  if (row.attempts > MAX_CODE_ATTEMPTS) {
    await sql`update login_codes set consumed_at = now() where id = ${row.id}`;
    return { ok: false, error: "Trop d'essais. Demandez un nouveau code." };
  }

  const expected = Buffer.from(row.code_hash, "hex");
  const actual = Buffer.from(hashCode(email, code), "hex");
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) {
    return { ok: false, error: "Code incorrect." };
  }

  const [consumed] = await sql`
    update login_codes set consumed_at = now() where id = ${row.id} and consumed_at is null returning id`;
  if (!consumed) return { ok: false, error: "Code déjà utilisé. Demandez-en un nouveau." };

  // L'adresse est vérifiée : on crée ou retrouve le compte.
  const [user] = await sql<{ id: string }[]>`
    insert into users (email, email_verified_at) values (${email}, now())
    on conflict (email) do update set email_verified_at = coalesce(users.email_verified_at, now()), updated_at = now()
    returning id`;

  await createSession(user.id);
  return { ok: true, userId: user.id };
}

/** Lien de connexion à usage unique (voir scripts/login-link.mts). */
export async function consumeLoginLink(token: string): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!token) return { ok: false, error: "Lien incomplet." };
  const [row] = await sql<{ user_id: string }[]>`
    update login_links set consumed_at = now()
    where token_hash = ${hashToken(token)} and consumed_at is null and expires_at > now()
    returning user_id`;
  if (!row) return { ok: false, error: "Ce lien a expiré ou a déjà servi. Demandez-en un nouveau." };
  await sql`update users set email_verified_at = coalesce(email_verified_at, now()), updated_at = now() where id = ${row.user_id}`;
  await createSession(row.user_id);
  return { ok: true };
}

async function createSession(userId: string) {
  const token = randomBytes(32).toString("base64url");
  await sql`
    insert into sessions (token_hash, user_id, expires_at)
    values (${hashToken(token)}, ${userId}, now() + make_interval(days => ${SESSION_DAYS}))`;
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: appUrl().startsWith("https://"),
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  });
}

export async function signOut() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) await sql`delete from sessions where token_hash = ${hashToken(token)}`;
  jar.delete(SESSION_COOKIE);
}

/** Utilisateur connecté (ou null). Mis en cache pour la durée de la requête. */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const [row] = await sql<
    {
      id: string;
      email: string;
      first_name: string | null;
      last_name: string | null;
      phone: string | null;
      staff_name: string | null;
      staff_role: "owner" | "manager" | null;
    }[]
  >`
    select u.id, u.email, u.first_name, u.last_name, u.phone,
           st.display_name as staff_name, st.role as staff_role
    from sessions s
    join users u on u.id = s.user_id
    left join staff st on st.user_id = u.id and st.active
    where s.token_hash = ${hashToken(token)} and s.expires_at > now()`;
  if (!row) return null;
  return {
    id: row.id,
    email: row.email,
    firstName: row.first_name,
    lastName: row.last_name,
    phone: row.phone,
    staff: row.staff_name ? { displayName: row.staff_name, role: row.staff_role! } : null,
  };
});

export async function requireUser(next = "/compte") {
  const user = await getCurrentUser();
  if (!user) redirect(`/connexion?suite=${encodeURIComponent(next)}`);
  return user;
}

/** Réservé à l'équipe KALIMA. À appeler dans chaque page et action d'administration. */
export async function requireStaff() {
  const user = await getCurrentUser();
  if (!user) redirect("/connexion?suite=/admin");
  if (!user.staff) redirect("/compte?acces=refuse");
  return user as CurrentUser & { staff: NonNullable<CurrentUser["staff"]> };
}

export function staffActor(user: CurrentUser & { staff: NonNullable<CurrentUser["staff"]> }) {
  return { userId: user.id, label: user.staff.displayName };
}

/** Rend un chemin de redirection sûr (interne au site uniquement). */
export function safeNext(value: string | null | undefined, fallback = "/compte") {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) return fallback;
  return value;
}
