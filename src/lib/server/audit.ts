import "server-only";
import type { Db } from "./db";

export type Actor = { userId: string | null; label: string };

export const SYSTEM_ACTOR: Actor = { userId: null, label: "Système" };

export async function audit(
  db: Db,
  actor: Actor,
  action: string,
  entityType: string,
  entityId: string | null,
  details: Record<string, unknown> = {},
) {
  await db`
    insert into audit_log (actor_user_id, actor_label, action, entity_type, entity_id, details)
    values (${actor.userId}, ${actor.label}, ${action}, ${entityType}, ${entityId}, ${db.json(details as never)})`;
}
