import { listNotifications } from "@/lib/server/admin-queries";
import { requireStaff } from "@/lib/server/auth";
import { emailProviderLabel } from "@/lib/server/email";
import { NotificationList } from "../_components/notification-list";
import { AdminHeader, EmptyState, Panel } from "../_components/ui";

export const metadata = { title: "E-mails" };

export default async function AdminNotifications() {
  await requireStaff();
  const rows = await listNotifications();
  return (
    <>
      <AdminHeader title="E-mails" subtitle={`Service d'envoi : ${emailProviderLabel()}. « Accepté » signifie que le service a pris l'e-mail en charge.`} />
      {rows.length === 0 ? <EmptyState>Aucun e-mail pour le moment.</EmptyState> : <Panel><NotificationList rows={rows} showOrder /></Panel>}
    </>
  );
}
