import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const dataDir = path.join(root, "data");

function sqlString(value) {
  return `'${String(value).replace(/'/g, "''")}'`;
}

const teams = JSON.parse(fs.readFileSync(path.join(dataDir, "teams.json"), "utf8"));
const pubs = JSON.parse(fs.readFileSync(path.join(dataDir, "pubs.json"), "utf8"));
const matches = JSON.parse(
  fs.readFileSync(path.join(dataDir, "matches.json"), "utf8"),
);
const spain = JSON.parse(
  fs.readFileSync(path.join(dataDir, "players/spain.json"), "utf8"),
);
const france = JSON.parse(
  fs.readFileSync(path.join(dataDir, "players/france.json"), "utf8"),
);
const players = [...spain, ...france];

const lines = ["-- Seed Matchday static data", ""];

for (const t of teams) {
  lines.push(
    `INSERT INTO public.teams (id, name, flag_url, country_code, color) VALUES (${sqlString(t.id)}, ${sqlString(t.name)}, ${sqlString(t.flagUrl)}, ${sqlString(t.countryCode)}, ${sqlString(t.color)}) ON CONFLICT (id) DO NOTHING;`,
  );
}

for (const p of pubs) {
  lines.push(
    `INSERT INTO public.pubs (id, name, image_url, lat, lng, address, neighborhood) VALUES (${sqlString(p.id)}, ${sqlString(p.name)}, ${sqlString(p.imageUrl)}, ${p.lat}, ${p.lng}, ${sqlString(p.address)}, ${sqlString(p.neighborhood)}) ON CONFLICT (id) DO NOTHING;`,
  );
}

for (const m of matches) {
  lines.push(
    `INSERT INTO public.matches (id, home_team_id, away_team_id, kickoff, status, venue) VALUES (${sqlString(m.id)}, ${sqlString(m.homeTeamId)}, ${sqlString(m.awayTeamId)}, ${sqlString(m.kickoff)}, ${sqlString(m.status)}, ${m.venue ? sqlString(m.venue) : "NULL"}) ON CONFLICT (id) DO NOTHING;`,
  );
}

for (const p of players) {
  lines.push(
    `INSERT INTO public.players (id, team_id, name, number, image_url, age, country, position, club, goals, assists, caps) VALUES (${sqlString(p.id)}, ${sqlString(p.teamId)}, ${sqlString(p.name)}, ${p.number}, ${sqlString(p.imageUrl)}, ${p.age}, ${sqlString(p.country)}, ${sqlString(p.position)}, ${sqlString(p.club)}, ${p.stats.goals}, ${p.stats.assists}, ${p.stats.caps}) ON CONFLICT (id) DO NOTHING;`,
  );
}

const outPath = path.join(
  root,
  "migrations/20260613215458_seed-matchday-data.sql",
);
fs.writeFileSync(outPath, `${lines.join("\n")}\n`);
console.log(`Wrote ${outPath}`);
