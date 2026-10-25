import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/brand";
import { signOutAction } from "@/lib/actions/auth";
import { getDashboardCounts } from "@/lib/server/admin-queries";
import { requireStaff } from "@/lib/server/auth";
import { expireStaleOrders } from "@/lib/server/orders";
import { AdminSidebar, AdminTabBar } from "./_components/admin-nav";

export const metadata: Metadata = {
  title: { default: "Administration", template: "%s · Administration KALIMA" },
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const staff = await requireStaff();
  await expireStaleOrders();
  const counts = await getDashboardCounts();
  const badges = {
    "/admin/commandes": counts.payments_declared + counts.rewards_to_validate + counts.to_start,
    "/admin/evenements": counts.new_events,
    "/admin/notifications": counts.failed_notifications,
  };

  return (
    <div className="min-h-full bg-cloud">
      <header className="sticky top-0 z-30 bg-night text-white shadow-[0_10px_30px_-18px_rgb(14_18_54/0.9)]">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6">
          <Link href="/admin" className="flex items-center gap-3" aria-label="Administration KALIMA, accueil">
            <span className="-rotate-2 rounded-xl bg-white px-2.5 py-1 shadow-[0_6px_14px_-8px_rgb(0_0_0/0.6)]">
              <Logo className="h-8 w-auto" />
            </span>
            <span className="hand text-2xl text-lilac">l&apos;atelier</span>
          </Link>
          <div className="flex items-center gap-3">
            <span className="hand hidden text-xl text-white/80 sm:inline">salut {staff.staff.displayName} !</span>
            <Link href="/" className="inline-flex min-h-10 items-center rounded-full border border-white/25 px-4 text-sm font-semibold transition hover:border-white/60 hover:bg-white/10">
              Voir le site
            </Link>
          </div>
        </div>
      </header>
      <div className="mx-auto flex max-w-7xl gap-8 px-4 pt-8 pb-28 sm:px-6 lg:pb-14">
        <AdminSidebar
          badges={badges}
          signOut={
            <form action={signOutAction}>
              <button type="submit" className="w-full rounded-xl px-2 py-2 text-left text-sm font-semibold text-muted transition hover:bg-kraft-soft/70 hover:text-night">
                Se déconnecter
              </button>
            </form>
          }
        />
        <main id="contenu" className="min-w-0 flex-1">{children}</main>
      </div>
      <AdminTabBar badges={badges} />
    </div>
  );
}
