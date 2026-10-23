import type { Metadata } from "next";
import { Suspense } from "react";
import { getCurrentUser } from "@/lib/auth";
import { logout } from "../login/actions";

export const metadata: Metadata = {
  title: "Tableau de bord",
};

export default function DashboardPage() {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-20">
      <h1 className="text-3xl font-semibold tracking-tight">Tableau de bord</h1>
      <Suspense
        fallback={<p className="text-foreground/60">Chargement de votre espace…</p>}
      >
        <Account />
      </Suspense>
    </div>
  );
}

async function Account() {
  const user = await getCurrentUser();

  return (
    <div className="flex flex-col items-start gap-4 rounded-xl border border-foreground/10 p-6">
      <p>
        Connecté en tant que <span className="font-medium">{user.email}</span>
      </p>
      <form action={logout}>
        <button
          type="submit"
          className="rounded-full border border-foreground/20 px-4 py-2 text-sm hover:bg-foreground/5"
        >
          Se déconnecter
        </button>
      </form>
    </div>
  );
}
