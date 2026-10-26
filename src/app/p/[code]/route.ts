import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { normalizeCode } from "@/lib/server/referrals";

// Lien de partage ambassadeur : mémorise le code pour le proposer à la commande.
export async function GET(request: NextRequest, { params }: RouteContext<"/p/[code]">) {
  const { code } = await params;
  const normalized = normalizeCode(code).slice(0, 12);
  if (normalized.length >= 4) {
    (await cookies()).set("kalima_ref", normalized, {
      httpOnly: true,
      sameSite: "lax",
      secure: request.nextUrl.protocol === "https:",
      path: "/",
      maxAge: 30 * 24 * 60 * 60,
    });
  }
  return NextResponse.redirect(new URL("/gourmandises", request.url));
}
