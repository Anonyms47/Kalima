import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/brand";
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
    "/admin/commandes": counts.payments_declared + counts.rewards_to_validate,
    "/admin/evenements": counts.new_events,
  };

  return (
    <div className="min-h-full bg-cloud">
      <header className="sticky top-0 z-30 border-b border-line bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6">
          <Link href="/admin" className="flex items-center gap-3">
            <Logo className="h-9 w-auto" />
            <span className="hidden rounded-full bg-night px-2.5 py-0.5 text-xs font-bold text-white sm:inline">Administration</span>
          </Link>
          <div className="flex items-center gap-3 text-sm">
            <span className="hidden text-muted sm:inline">{staff.staff.displayName}</span>
            <Link href="/" className="btn-ghost btn-sm">Voir le site</Link>
          </div>
        </div>
      </header>
      <div className="mx-auto flex max-w-7xl gap-8 px-4 pt-6 pb-28 sm:px-6 lg:pb-12">
        <AdminSidebar />
        <main id="contenu" className="min-w-0 flex-1">{children}</main>
      </div>
      <AdminTabBar badges={badges} />
    </div>
  );
}
