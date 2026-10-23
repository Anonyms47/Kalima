import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getCurrentUser } from "@/lib/server/auth";
import { getSettings } from "@/lib/server/settings";

export default async function SiteLayout({ children }: LayoutProps<"/">) {
  const [user, settings] = await Promise.all([getCurrentUser(), getSettings()]);
  return (
    <>
      <SiteHeader signedIn={Boolean(user)} isStaff={Boolean(user?.staff)} />
      {settings.announcement ? (
        <aside aria-label="Annonce" className="bg-night px-4 py-2.5 text-center text-sm font-medium text-white">{settings.announcement}</aside>
      ) : null}
      <main id="contenu" className="flex flex-1 flex-col">
        {children}
      </main>
      <SiteFooter settings={settings} />
    </>
  );
}
