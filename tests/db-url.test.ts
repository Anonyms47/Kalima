import { describe, expect, it } from "vitest";
import { describeDatabaseUrl } from "@/lib/server/db";

describe("diagnostic de DATABASE_URL", () => {
  it("décrit l'adresse sans jamais afficher le mot de passe", () => {
    const text = describeDatabaseUrl("postgresql://postgres.abc:Secret123@aws-0-eu-north-1.pooler.supabase.com:6543/postgres");
    expect(text).toContain("hôte=aws-0-eu-north-1.pooler.supabase.com");
    expect(text).toContain("port=6543");
    expect(text).toContain("utilisateur=postgres.abc");
    expect(text).toContain("mot de passe=9 caractère(s)");
    expect(text).not.toContain("Secret123");
  });

  it("signale le modèle [YOUR-PASSWORD] et les caractères spéciaux", () => {
    expect(describeDatabaseUrl("postgresql://postgres.abc:[YOUR-PASSWORD]@h:6543/postgres")).toContain("crochets ou modèle non remplacé");
    expect(describeDatabaseUrl("postgresql://postgres.abc:a%40b@h:6543/postgres")).toContain("caractères spéciaux présents");
  });

  it("signale une adresse illisible", () => {
    expect(describeDatabaseUrl("pas une adresse")).toContain("adresse illisible");
  });
});
