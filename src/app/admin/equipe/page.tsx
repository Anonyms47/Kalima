import { setStaffActiveAction } from "@/lib/actions/admin/other";
import { requireStaff } from "@/lib/server/auth";
import { sql } from "@/lib/server/db";
import { AdminHeader, Panel, Pill } from "../_components/ui";
import { AddStaffForm } from "./add-staff-form";

export const metadata = { title: "Équipe" };

export default async function AdminTeam() {
  const me = await requireStaff();
  const members = await sql<{ user_id: string; display_name: string; role: string; active: boolean; email: string }[]>`
    select s.user_id, s.display_name, s.role, s.active, u.email from staff s join users u on u.id = s.user_id order by s.role, s.display_name`;
  const isOwner = me.staff.role === "owner";
  return (
    <>
      <AdminHeader title="Équipe" subtitle="Accès nominatifs. Chaque personne se connecte avec un code reçu sur son e-mail." />
      <Panel>
        <ul className="divide-y divide-line">
          {members.map((m) => (
            <li key={m.user_id} className="flex flex-wrap items-center justify-between gap-3 py-3">
              <div>
                <p className="font-semibold">{m.display_name} {m.user_id === me.id ? <span className="font-normal text-muted">(vous)</span> : null}</p>
                <p className="text-sm text-muted">{m.email}</p>
              </div>
              <div className="flex items-center gap-2">
                <Pill tone={m.role === "owner" ? "night" : "violet"}>{m.role === "owner" ? "Gérante" : "Équipe"}</Pill>
                {!m.active ? <Pill tone="danger">Désactivé</Pill> : null}
                {isOwner && m.role !== "owner" ? (
                  <form action={setStaffActiveAction}>
                    <input type="hidden" name="userId" value={m.user_id} />
                    <input type="hidden" name="active" value={m.active ? "false" : "true"} />
                    <button type="submit" className="btn-ghost btn-sm">{m.active ? "Désactiver" : "Réactiver"}</button>
                  </form>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      </Panel>
      {isOwner ? (
        <Panel title="Ajouter une personne" className="mt-5">
          <AddStaffForm />
        </Panel>
      ) : null}
    </>
  );
}
