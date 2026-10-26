import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";
import { appUrl } from "@/lib/config";
import { sql } from "@/lib/server/db";
import { normalizeCode } from "@/lib/server/referrals";

const C = { night: "#0E1236", violet: "#4B4992", lilac: "#DCBFDB", kraft: "#C9A57B", kraftDeep: "#7A5228", paper: "#FFFDF8", cloud: "#F8F8FF" };

const asset = (path: string) => readFile(join(process.cwd(), path));

/** Badge « Ambassadeur KALIMA » à partager (statut WhatsApp, Instagram…), 1080 × 1350. */
export async function GET(_request: NextRequest, { params }: RouteContext<"/p/[code]/badge">) {
  const code = normalizeCode((await params).code).slice(0, 12);
  const [amb] = code.length >= 4
    ? await sql<{ code: string; first_name: string | null }[]>`
        select a.code, u.first_name from ambassadors a join users u on u.id = a.user_id where a.code = ${code} and a.active`
    : [];
  if (!amb) return new Response("Badge introuvable", { status: 404 });

  const [fredokaBold, fredokaMedium, caveat, logo] = await Promise.all([
    asset("assets/fonts/Fredoka-Bold.ttf"),
    asset("assets/fonts/Fredoka-Medium.ttf"),
    asset("assets/fonts/Caveat-Bold.ttf"),
    asset("public/brand/logo-kalima.png"),
  ]);
  const name = (amb.first_name ?? "").trim().split(/\s+/)[0] || "";
  const host = appUrl().replace(/^https?:\/\//, "");
  const stamps = [0, 1, 2, 3, 4];

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", background: C.night, padding: 70, fontFamily: "Fredoka" }}>
        {/* Carte papier scotchée */}
        <div style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center", width: "100%", flex: 1, background: C.paper, borderRadius: 48, padding: "90px 70px 60px", transform: "rotate(-1.5deg)" }}>
          <div style={{ position: "absolute", top: -26, left: 380, width: 200, height: 52, background: C.lilac, opacity: 0.9, borderRadius: 6, transform: "rotate(-4deg)" }} />
          {/* eslint-disable-next-line @next/next/no-img-element -- rendu par ImageResponse, pas par le navigateur */}
          <img src={`data:image/png;base64,${logo.toString("base64")}`} width={316} height={162} alt="" />
          <div style={{ marginTop: 26, fontFamily: "Caveat", fontSize: 64, color: C.violet, transform: "rotate(-2deg)" }}>ambassadeur officiel</div>
          {name ? <div style={{ marginTop: 6, fontSize: 104, fontWeight: 700, color: C.night, lineHeight: 1 }}>{name}</div> : null}

          {/* Étiquette kraft avec le code */}
          <div style={{ marginTop: 56, display: "flex", flexDirection: "column", alignItems: "center", background: C.kraft, borderRadius: 28, padding: "26px 64px 30px", transform: "rotate(1.5deg)" }}>
            <div style={{ fontSize: 30, fontWeight: 500, letterSpacing: 6, color: C.kraftDeep }}>MON CODE</div>
            <div style={{ fontSize: 112, fontWeight: 700, letterSpacing: 6, color: C.night, lineHeight: 1.05 }}>{amb.code}</div>
          </div>

          <div style={{ marginTop: 60, display: "flex", gap: 22 }}>
            {stamps.map((i) => (
              <div key={i} style={{ width: 76, height: 76, borderRadius: 999, border: `5px solid ${C.violet}`, display: "flex", alignItems: "center", justifyContent: "center", color: C.violet, fontFamily: "Caveat", fontSize: 40, transform: `rotate(${i % 2 ? 12 : -10}deg)` }}>
                K!
              </div>
            ))}
          </div>
          <div style={{ marginTop: 34, fontFamily: "Caveat", fontSize: 52, color: C.night, textAlign: "center" }}>
            gaufres &amp; mini pancakes, avec un petit mot
          </div>
        </div>

        <div style={{ marginTop: 44, display: "flex", flexDirection: "column", alignItems: "center", color: C.cloud }}>
          <div style={{ fontSize: 38, fontWeight: 500 }}>Saisis mon code à ta commande sur</div>
          <div style={{ fontSize: 44, fontWeight: 700, color: C.lilac }}>{`${host}/p/${amb.code}`}</div>
        </div>
      </div>
    ),
    {
      width: 1080,
      height: 1350,
      fonts: [
        { name: "Fredoka", data: fredokaBold, weight: 700, style: "normal" },
        { name: "Fredoka", data: fredokaMedium, weight: 500, style: "normal" },
        { name: "Caveat", data: caveat, weight: 700, style: "normal" },
      ],
      headers: { "Cache-Control": "public, max-age=3600" },
    },
  );
}
