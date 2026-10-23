import Link from "next/link";

const features = [
  {
    title: "Comptes utilisateurs",
    description:
      "Inscription, connexion et déconnexion par e-mail grâce à Supabase Auth.",
  },
  {
    title: "Base de données",
    description:
      "Une base Postgres hébergée par Supabase, prête à recevoir vos tables.",
  },
  {
    title: "Pages protégées",
    description:
      "Le tableau de bord n'est accessible qu'aux utilisateurs connectés.",
  },
];

export default function Home() {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-16 px-4 py-20">
      <section className="flex flex-col items-start gap-6">
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
          Bienvenue sur Kalima
        </h1>
        <p className="max-w-xl text-lg text-foreground/70">
          Le point de départ de votre application web. Créez un compte pour
          accéder à votre espace personnel.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/login"
            className="rounded-full bg-foreground px-5 py-3 text-background hover:opacity-90"
          >
            Commencer
          </Link>
          <Link
            href="/dashboard"
            className="rounded-full border border-foreground/20 px-5 py-3 hover:bg-foreground/5"
          >
            Mon espace
          </Link>
        </div>
      </section>

      <section className="grid gap-6 sm:grid-cols-3">
        {features.map((feature) => (
          <div
            key={feature.title}
            className="rounded-xl border border-foreground/10 p-6"
          >
            <h2 className="font-medium">{feature.title}</h2>
            <p className="mt-2 text-sm text-foreground/70">
              {feature.description}
            </p>
          </div>
        ))}
      </section>
    </div>
  );
}
