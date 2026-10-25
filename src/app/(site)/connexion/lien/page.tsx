import type { Metadata } from "next";
import { PaperCard } from "@/components/paper-card";
import { safeNext } from "@/lib/server/auth";
import { LinkForm } from "./link-form";

export const metadata: Metadata = { title: "Lien de connexion", robots: { index: false } };

// Le lien ne se consomme qu'au clic : les aperçus de liens (messageries, antivirus) ne l'utilisent pas.
export default async function LoginLinkPage({ searchParams }: PageProps<"/connexion/lien">) {
  const { t, suite } = await searchParams;
  return (
    <div data-hide-footer-cta className="mx-auto w-full max-w-md px-4 pt-12 pb-20 sm:px-6 md:pt-20">
      <p className="hand -rotate-2 text-3xl text-violet">re-bonjour !</p>
      <h1 className="display mt-1 text-4xl">Lien de connexion</h1>
      <PaperCard className="mt-8">
        <LinkForm token={typeof t === "string" ? t : ""} next={safeNext(typeof suite === "string" ? suite : null, "/admin")} />
      </PaperCard>
    </div>
  );
}
