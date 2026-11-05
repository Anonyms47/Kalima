import { formatDate } from "@/lib/format";
import { NOTIFICATION_LABELS } from "@/lib/server/notifications";
import type { NotificationRow } from "@/lib/server/admin-queries";
import { Pill } from "./ui";
import { ResendButton } from "./resend-button";

const STATUS = {
  pending: { label: "En attente", tone: "warning" },
  sending: { label: "Envoi en cours", tone: "warning" },
  sent: { label: "Accepté", tone: "success" },
  failed: { label: "Échec", tone: "danger" },
} as const;

export function NotificationList({ rows, showOrder = false }: { rows: NotificationRow[]; showOrder?: boolean }) {
  return (
    <ul className="divide-y divide-line">
      {rows.map((n) => (
        <li key={n.id} className="flex flex-wrap items-start justify-between gap-3 py-3">
          <div className="min-w-0 text-sm">
            <p className="font-semibold">
              {NOTIFICATION_LABELS[n.kind as keyof typeof NOTIFICATION_LABELS] ?? n.kind}
              {showOrder && n.order_reference ? <span className="tabular font-normal text-muted"> · {n.order_reference}</span> : null}
            </p>
            <p className="text-muted">
              {n.recipient} · {formatDate(n.sent_at ?? n.created_at)} · {n.attempts} tentative{n.attempts > 1 ? "s" : ""}
              {n.provider === "log" ? " · mode test, aucun envoi réel" : ""}
            </p>
            {n.last_error && n.status !== "sent" ? <p className="mt-1 text-danger">{n.last_error}</p> : null}
          </div>
          <div className="flex items-center gap-2">
            <Pill tone={STATUS[n.status].tone}>{STATUS[n.status].label}</Pill>
            {n.status === "failed" || n.status === "pending" ? <ResendButton id={n.id} /> : null}
          </div>
        </li>
      ))}
    </ul>
  );
}
