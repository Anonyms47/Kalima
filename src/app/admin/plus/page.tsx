import Link from "next/link";
import { ArrowIcon } from "@/components/icons";
import { signOutAction } from "@/lib/actions/auth";
import { SECONDARY_LINKS } from "../_components/admin-links";
import { AdminHeader } from "../_components/ui";

export default function AdminMorePage() {
  return (
    <>
      <AdminHeader title="Plus" />
      <ul className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-white">
        {SECONDARY_LINKS.map((link) => (
          <li key={link.href}>
            <Link href={link.href} className="flex items-center justify-between px-5 py-4 font-semibold hover:bg-mist">
              {link.label} <ArrowIcon className="size-4 text-muted" />
            </Link>
          </li>
        ))}
      </ul>
      <form action={signOutAction} className="mt-6">
        <button type="submit" className="btn-ghost w-full">Se déconnecter</button>
      </form>
    </>
  );
}
