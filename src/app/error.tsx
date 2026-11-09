"use client";

import Link from "next/link";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="mx-auto flex w-full max-w-xl flex-col items-center px-4 py-24 text-center">
      <h1 className="display text-4xl">Un petit souci technique</h1>
      <p className="mt-3 text-muted">La page n&apos;a pas pu s&apos;afficher. Réessayez dans un instant.</p>
      <div className="mt-8 flex gap-3">
        <button type="button" onClick={reset} className="btn-primary">Réessayer</button>
        <Link href="/" className="btn-ghost">Accueil</Link>
      </div>
    </div>
  );
}
