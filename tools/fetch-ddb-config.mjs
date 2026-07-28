#!/usr/bin/env node
/**
 * Refresh data/fallback-config.json from the live D&D Beyond config endpoint.
 *
 *   npm run data:config          # fetch and write
 *   npm run data:config:dry      # fetch and report, write nothing
 *
 * Needs an authenticated cobalt token in DDB_COBALT_TOKEN (see .env.example).
 *
 * Flags:
 *   --dry-run          report only, do not write
 *   --out <path>       output file (default data/fallback-config.json)
 *   --base <path>      file the redaction rules are read from (default --out)
 *   --source <path>    read the payload from a saved JSON file instead of the
 *                      network (round trip testing, no token needed)
 */

import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import prettier from "prettier";

import {
  applyOmissions,
  applyRedactions,
  collectDescriptionShapes,
  collectRedactions,
  describeNewDescriptions,
  mergeTopLevelKeys,
  summariseDiff,
  toPrettyJson,
} from "./ddb-config-transform.mjs";

const CONFIG_URL = "https://www.dndbeyond.com/api/config/json";
const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DEFAULT_OUT = path.join(REPO_ROOT, "data", "fallback-config.json");

function parseArgs(argv) {
  const options = { dryRun: false, out: DEFAULT_OUT, base: null, source: null };
  const pathFlags = { "--out": "out", "--base": "base", "--source": "source" };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--dry-run") {
      options.dryRun = true;
    } else if (pathFlags[arg]) {
      const value = argv[index + 1];
      if (!value) throw new Error(`${arg} requires a path`);
      options[pathFlags[arg]] = path.resolve(REPO_ROOT, value);
      index += 1;
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }
  options.base ??= options.out;
  return options;
}

async function readJson(filePath) {
  return JSON.parse(await fs.readFile(filePath, "utf8"));
}

async function fetchConfig() {
  const token = process.env.DDB_COBALT_TOKEN;
  if (!token) {
    throw new Error(
      "DDB_COBALT_TOKEN is not set. Copy .env.example to .env and paste an authenticated cobalt token, "
        + "or export DDB_COBALT_TOKEN in your shell.",
    );
  }

  const response = await fetch(CONFIG_URL, {
    method: "GET",
    headers: {
      "accept": "application/json",
      "authorization": `Bearer ${token}`,
      "cache-control": "no-cache",
      "pragma": "no-cache",
      "cookie": `cobalt-token=${token}`,
      "referer": "https://www.dndbeyond.com/my-encounters",
    },
  });

  if (!response.ok) {
    throw new Error(`${CONFIG_URL} returned ${response.status} ${response.statusText}. Is the token still valid?`);
  }

  const payload = await response.json();
  if (!Array.isArray(payload?.sources) || payload.sources.length === 0) {
    throw new Error("Response did not contain a populated `sources` array, refusing to use it.");
  }
  return payload;
}

function report(label, items, format = (item) => item) {
  if (items.length === 0) return;
  console.log(`${label} (${items.length}):`);
  for (const item of items) console.log(`  - ${format(item)}`);
}

async function main() {
  const options = parseArgs(process.argv.slice(2));

  const current = await readJson(options.base);
  const remote = options.source ? await readJson(options.source) : await fetchConfig();
  console.log(
    options.source
      ? `Loaded payload from ${path.relative(REPO_ROOT, options.source)}`
      : `Fetched ${CONFIG_URL}`,
  );
  if (options.base !== options.out) console.log(`Redaction rules read from ${path.relative(REPO_ROOT, options.base)}`);

  const redactions = collectRedactions(current);
  const shapes = collectDescriptionShapes(current);
  const { merged, droppedKeys, keptStale } = mergeTopLevelKeys(current, remote);
  const { removed, unknownShapes } = applyOmissions(merged, shapes);
  const { applied, missing } = applyRedactions(merged, redactions);
  const newDescriptions = describeNewDescriptions(current, remote, redactions);
  const changes = summariseDiff(current, merged);

  console.log(`Top level keys: ${Object.keys(merged).length} kept from the committed file`);
  report("Remote only keys dropped (add to IDDBConfig first if wanted)", droppedKeys);
  report("Keys missing from the response, kept from the committed file", keptStale);

  const removedByShape = removed.reduce((counts, item) => counts.set(item.shape, (counts.get(item.shape) ?? 0) + 1), new Map());
  report(
    "Descriptions deleted (the committed file never carries one here)",
    [...removedByShape.entries()],
    ([shape, count]) => `${shape}.description: ${count}`,
  );
  report(
    "Descriptions on shapes the committed file has never seen, review before committing",
    [...unknownShapes.entries()],
    ([shape, count]) => `${shape}.description: ${count}`,
  );

  console.log(`Blank descriptions tracked: ${redactions.length}, re-blanked: ${applied.length}`);
  report("Redacted entries no longer in the response", missing, (item) => item.display);
  report("NEW entries with description text, review before committing", newDescriptions, (item) =>
    `${item.key} ${item.entry}${item.name ? ` (${item.name})` : ""}`);

  if (changes.length === 0) {
    console.log("No data changes.");
  } else {
    console.log(`Changed keys (${changes.length}):`);
    for (const change of changes) {
      const parts = [];
      if (change.added.length > 0) parts.push(`+${change.added.length} [${change.added.slice(0, 5).join(", ")}]`);
      if (change.removed.length > 0) parts.push(`-${change.removed.length} [${change.removed.slice(0, 5).join(", ")}]`);
      console.log(`  - ${change.key}${parts.length > 0 ? `: ${parts.join(" ")}` : ": field values changed"}`);
    }
  }

  // Resolve against the repo, not options.out: an --out outside the repo would
  // otherwise miss .prettierrc and fall back to printWidth 80.
  const prettierConfig = await prettier.resolveConfig(DEFAULT_OUT);
  // toPrettyJson lays out objects and arrays the way the committed file does;
  // prettier then applies printWidth so the result is byte identical in shape
  // to what a prettier run on the existing file produces.
  const formatted = await prettier.format(toPrettyJson(merged), {
    ...prettierConfig,
    parser: "json",
    filepath: DEFAULT_OUT,
  });

  if (options.dryRun) {
    console.log("Dry run, nothing written.");
    return;
  }

  await fs.writeFile(options.out, formatted, "utf8");
  console.log(`Wrote ${path.relative(REPO_ROOT, options.out)}`);
}

try {
  await main();
} catch (error) {
  console.error(`fetch-ddb-config failed: ${error.message}`);
  process.exitCode = 1;
}
