import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Bang } from "@/components/brand";
import { LoginForm } from "@/components/login-form";
import { Note } from "@/components/note";
import { getCurrentUser, safeNext } from "@/lib/server/auth";

export const metadata: Metadata = { title: "Connexion" };

export default async function LoginPage({ searchParams }: PageProps<"/connexion">) {
  const { suite } = await searchParams;
  const next = safeNext(typeof suite === "string" ? suite : null, "/compte");
  if (await getCurrentUser()) redirect(next);

  return (
    <div className="mx-auto grid w-full max-w-5xl items-center gap-12 px-4 py-14 sm:px-6 md:grid-cols-2 md:py-20">
      <div>
        <p className="eyebrow"><Bang className="h-4 w-2.5 text-lilac" /> Mon espace KALIMA</p>
        <h1 className="display mt-3 text-5xl">Connexion</h1>
        <p className="mt-4 max-w-md text-lg leading-relaxed text-muted">
          Retrouvez vos commandes, suivez leur avancement et participez au programme ambassadeur. Pas encore de compte ? Il se crée tout seul à la première connexion.
        </p>
        <Note className="mt-10 hidden max-w-xs md:block" tilt="rotate-[-2deg]">
          Un code, et vous voilà chez vous.
        </Note>
      </div>
      <div className="card p-6 sm:p-8">
        <LoginForm next={next} />
      </div>
    </div>
  );
}
