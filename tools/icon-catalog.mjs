/**
 * Maintenance and build projection for data/icon-catalog.json. See "Icon catalogue" in
 * CONTRIBUTING.md.
 *
 *   node tools/icon-catalog.mjs index --icons <foundry>/public/icons [--catalog FILE]
 *   node tools/icon-catalog.mjs runtime [--catalog FILE] [--output FILE]
 */
import fs from "node:fs";
import process from "node:process";
import path from "node:path";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";
import { FILE_MAP } from "../src/lib/IconizerMatcher.mjs";
import { tokens } from "../src/lib/IconCatalogSearch.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const DEFAULT_CATALOG = path.join(root, "data/icon-catalog.json");
export const DEFAULT_RUNTIME_CATALOG = path.join(root, "dist/icon-catalog.json");

const USAGE = [
  "Usage: node tools/icon-catalog.mjs index --icons DIR [--catalog FILE]",
  "       node tools/icon-catalog.mjs runtime [--catalog FILE] [--output FILE]",
  "See \"Icon catalogue\" in CONTRIBUTING.md for visual/manual tagging and the review workshop.",
  "",
].join("\n");

/** Write through a temporary file so an interrupted run never leaves half a catalogue. */
function write(file, value, pretty = true) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const temporary = `${file}.tmp-${process.pid}`;
  try {
    fs.writeFileSync(temporary, JSON.stringify(value, null, pretty ? 2 : undefined) + "\n");
    fs.renameSync(temporary, file);
  } finally {
    if (fs.existsSync(temporary)) fs.unlinkSync(temporary);
  }
}

export function readCatalog(file = DEFAULT_CATALOG) {
  const data = JSON.parse(fs.readFileSync(file, "utf8"));
  if (data.version !== 1 || !Array.isArray(data.icons)) throw new Error(`Invalid catalogue: ${file}`);
  return data;
}

/**
 * The copy the browser downloads. The checked-in source stays reviewable; this drops the
 * `id` (always equal to `path`) and the content `hash` (only the maintenance tools use it).
 */
export function runtimeCatalog(catalog) {
  return {
    version: 1,
    icons: catalog.icons.map(({ path: image, name, tags, inferred, manual }) => ({
      path: image,
      name,
      tags,
      inferred,
      manual,
    })),
  };
}

export function buildRuntimeCatalog(output = DEFAULT_RUNTIME_CATALOG, catalog = DEFAULT_CATALOG) {
  write(output, runtimeCatalog(readCatalog(catalog)), false);
}

function walk(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const file = path.join(directory, entry.name);
    if (entry.isSymbolicLink()) return [];
    if (entry.isDirectory()) return walk(file);
    return entry.isFile() && (/\.(webp|png|jpe?g|svg)$/i).test(entry.name) ? [file] : [];
  });
}

/**
 * Rebuild the catalogue from an installed Foundry icons directory. Manual tags survive for
 * every retained path; visual tags survive only while the artwork hash is unchanged, since
 * they describe that exact image. Paths that no longer exist are dropped.
 */
export function indexCatalog(iconDir, catalog = DEFAULT_CATALOG, tablesRoot = path.join(root, "data")) {
  const previous = fs.existsSync(catalog) ? readCatalog(catalog).icons : [];
  const byPath = new Map(previous.map((icon) => [icon.path, icon]));
  // the importer's own icon mapping tables supply extra search words for the images they use
  const names = new Map();
  for (const name of new Set(Object.values(FILE_MAP).flat())) {
    for (const entry of JSON.parse(fs.readFileSync(path.join(tablesRoot, name), "utf8"))) {
      names.set(entry.path, [...(names.get(entry.path) ?? []), entry.name]);
    }
  }
  const icons = walk(iconDir)
    .map((file) => {
      const relative = "icons/" + path.relative(iconDir, file).split(path.sep).join("/");
      const hash = createHash("sha256").update(fs.readFileSync(file)).digest("hex");
      const old = byPath.get(relative);
      return {
        id: relative,
        path: relative,
        hash,
        tags: tokens(relative + " " + (names.get(relative) ?? []).join(" ")),
        name: path.basename(file, path.extname(file)).replaceAll("-", " "),
        inferred: old?.hash === hash ? old.inferred : [],
        manual: old?.manual ?? [],
      };
    })
    .sort((a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0));
  if (!icons.length) throw new Error(`No supported images in ${iconDir}; catalogue unchanged`);
  write(catalog, { version: 1, icons });
  return icons;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: {
      icons: { type: "string" },
      catalog: { type: "string", default: DEFAULT_CATALOG },
      output: { type: "string" },
      help: { type: "boolean" },
    },
  });
  const command = positionals[0];
  if (values.help || !command) {
    process.stdout.write(USAGE);
  } else if (command === "index") {
    if (!values.icons) throw new Error("index requires --icons pointing to Foundry's public/icons directory");
    process.stdout.write(`Indexed ${indexCatalog(values.icons, values.catalog).length} icons.\n`);
  } else if (command === "runtime") {
    buildRuntimeCatalog(values.output, values.catalog);
  } else {
    throw new Error(`Unknown command: ${command}`);
  }
}
