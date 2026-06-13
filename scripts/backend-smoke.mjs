#!/usr/bin/env node
/**
 * Backend smoke checks for InsForge (schema, seed, RLS).
 * Run: npm run backend:smoke
 */
import { execSync } from "node:child_process";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");

function run(label, command) {
  try {
    execSync(command, { cwd: root, stdio: "pipe", encoding: "utf8" });
    console.log(`✓ ${label}`);
    return true;
  } catch (error) {
    const detail =
      error instanceof Error && "stdout" in error
        ? String(error.stdout || error.stderr || error.message)
        : String(error);
    console.error(`✗ ${label}: ${detail.trim()}`);
    return false;
  }
}

let passed = 0;
let total = 0;

function check(label, command) {
  total += 1;
  if (run(label, command)) passed += 1;
}

if (!existsSync(resolve(root, ".insforge/project.json"))) {
  console.error("✗ InsForge project not linked (.insforge/project.json missing)");
  process.exit(1);
}
check("InsForge project linked", "npx @insforge/cli current");

const envLocal = resolve(root, ".env.local");
if (!existsSync(envLocal)) {
  console.error("✗ .env.local missing");
  process.exit(1);
}
const env = readFileSync(envLocal, "utf8");
for (const key of [
  "NEXT_PUBLIC_INSFORGE_URL",
  "NEXT_PUBLIC_INSFORGE_ANON_KEY",
  "NEXT_PUBLIC_USE_INSFORGE=true",
]) {
  total += 1;
  if (env.includes(key)) {
    console.log(`✓ env ${key}`);
    passed += 1;
  } else {
    console.error(`✗ env missing ${key}`);
  }
}

check(
  "seed data: teams",
  `npx @insforge/cli db query "SELECT COUNT(*) AS n FROM public.teams" --json`,
);
check(
  "seed data: pubs",
  `npx @insforge/cli db query "SELECT COUNT(*) AS n FROM public.pubs" --json`,
);
check(
  "seed data: matches",
  `npx @insforge/cli db query "SELECT COUNT(*) AS n FROM public.matches" --json`,
);
check(
  "seed data: players",
  `npx @insforge/cli db query "SELECT COUNT(*) AS n FROM public.players" --json`,
);
check(
  "RLS DELETE policies",
  `npx @insforge/cli db query "SELECT COUNT(*) AS n FROM pg_policies WHERE schemaname = 'public' AND cmd = 'DELETE'" --json`,
);
check(
  "realtime triggers",
  `npx @insforge/cli db query "SELECT COUNT(*) AS n FROM pg_trigger WHERE tgname LIKE 'notify_%'" --json`,
);
check(
  "migrations applied",
  "npx @insforge/cli db migrations list",
);

console.log(`\n${passed}/${total} checks passed`);
process.exit(passed === total ? 0 : 1);
