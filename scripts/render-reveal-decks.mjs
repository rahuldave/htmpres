#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { existsSync, readdirSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const decksDir = path.join(root, "decks");

const explicit = process.argv.slice(2);
const qmdFiles = explicit.length
  ? explicit
  : readdirSync(decksDir, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => path.join("decks", entry.name, "index.qmd"))
      .filter((file) => existsSync(path.resolve(root, file)));

for (const file of qmdFiles) {
  console.log(`Rendering ${file} with Quarto revealjs`);
  const result = spawnSync("quarto", ["render", file], {
    cwd: root,
    encoding: "utf8",
    stdio: "inherit",
  });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}
