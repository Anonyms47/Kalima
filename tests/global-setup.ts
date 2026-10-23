import { execFileSync } from "node:child_process";

export default function setup() {
  const url = process.env.TEST_DATABASE_URL ?? "postgres://kalima:kalima@localhost:5432/kalima_test";
  execFileSync("npx", ["tsx", "scripts/db.mts", "reset"], {
    stdio: "inherit",
    env: { ...process.env, DATABASE_URL: url },
  });
}
