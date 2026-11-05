import "server-only";
import { sql } from "./db";

/** Limite simple par fenêtre fixe, partagée entre les instances via la base. */
export async function rateLimit(bucket: string, limit: number, windowSeconds: number) {
  const [row] = await sql<{ count: number }[]>`
    insert into rate_limits (bucket, window_start, count)
    values (${bucket}, to_timestamp(floor(extract(epoch from now()) / ${windowSeconds}) * ${windowSeconds}), 1)
    on conflict (bucket, window_start) do update set count = rate_limits.count + 1
    returning count`;
  return row.count <= limit;
}
