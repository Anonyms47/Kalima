import { readLocalImage } from "@/lib/server/storage";

// Photos téléversées en développement (en production : stockage Supabase).
export async function GET(_request: Request, { params }: RouteContext<"/media/[...path]">) {
  const { path } = await params;
  const data = await readLocalImage(path.join("/"));
  if (!data) return new Response("Introuvable", { status: 404 });
  return new Response(new Uint8Array(data), {
    headers: { "content-type": "image/webp", "cache-control": "public, max-age=31536000, immutable" },
  });
}
