import Link from "next/link";
import { ArrowIcon } from "@/components/icons";
import { signOutAction } from "@/lib/actions/auth";
import { getDashboardCounts } from "@/lib/server/admin-queries";
import { SECONDARY_LINKS } from "../_components/admin-links";
import { AdminHeader, Count } from "../_components/ui";

export default async function AdminMorePage() {
  const counts = await getDashboardCounts();
  const badges: Record<string, number> = { "/admin/notifications": counts.failed_notifications, "/admin/box-famille": counts.new_family_boxes };
  return (
    <>
      <AdminHeader kicker="et le reste…" title="Plus" />
      <ul className="divide-y-2 divide-dotted divide-kraft/35 overflow-hidden rounded-[1.3rem] border border-[#efe4d2] bg-paper shadow-[var(--shadow-soft)]">
        {SECONDARY_LINKS.map((link) => (
          <li key={link.href}>
            <Link href={link.href} className="flex items-center justify-between gap-3 px-5 py-3.5 transition hover:bg-kraft-soft/60">
              <span>
                <span className="display block text-lg">{link.label}</span>
                <span className="hand block text-lg leading-tight text-violet/80">{link.hint}</span>
              </span>
              <span className="flex items-center gap-2">
                <Count value={badges[link.href] ?? 0} />
                <ArrowIcon className="size-4 text-kraft-deep" />
              </span>
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
