import Link from "next/link";
import { Note } from "@/components/note";

export default function NotFound() {
  return (
    <div className="mx-auto flex w-full max-w-xl flex-col items-center px-4 py-20 text-center">
      <Note className="w-full max-w-sm">Oups… cette page s&apos;est fait croquer.</Note>
      <h1 className="display mt-12 text-4xl">Page introuvable</h1>
      <p className="mt-3 text-muted">Le lien est peut-être incorrect, ou ce contenu n&apos;est plus disponible.</p>
      <Link href="/gourmandises" className="btn-primary mt-8">Voir les gourmandises</Link>
    </div>
  );
}
