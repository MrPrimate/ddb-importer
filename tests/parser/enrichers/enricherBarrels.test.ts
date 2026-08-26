/**
 * Guards the enricher naming convention that the factory lookup depends on.
 *
 * src/parser/enrichers/_linkBuilder.js generates every `_module.ts` barrel by
 * reading each file's declared class name. It only `console.warn`s when a class
 * name is not contained in its file name, and nothing at all notices when a
 * barrel is stale because someone forgot `npm run link` - so both failures ship
 * silently today. DDBClassFeatureEnricher._defaultClassLoader resolves an
 * enricher as ClassEnrichers[pascalCase(class)][pascalCase(featureName)], i.e.
 * off the barrel key, so a missing export means the enricher never loads and
 * the feature quietly falls back to Generic.
 *
 * This walks the source tree rather than importing the barrels: the point is to
 * compare what is on disk against what the generated barrel says, which an
 * import of the barrel alone cannot do.
 *
 * Abstract bases (`_StormAura`) are excluded on both sides. _linkBuilder skips
 * them because an `abstract new (...)` in a lookup map typed as concrete
 * constructors does not typecheck, and they are extended by a direct import
 * rather than resolved by name.
 */
import fs from "node:fs";
import path from "node:path";

const ENRICHER_ROOT = path.resolve(process.cwd(), "src/parser/enrichers");

// mirrors _linkBuilder.js: flat folders get their own barrel, nested ones get a
// barrel per subdirectory plus a parent barrel of namespace re-exports
const FLAT_DIRECTORIES = ["generic", "feat", "spell", "item", "background"];
const NESTED_DIRECTORIES = ["monster", "class", "trait"];

/** Same shape _linkBuilder.js matches, anchored so prose in comments cannot hit. */
const CLASS_DECLARATION = /^\s*(?:export\s+default\s+)?(abstract\s+)?class\s+([A-Za-z_$][\w$]*)/m;
const BARREL_EXPORT = /export \{ default as (\w+) \}/g;

function enricherFolders(): string[] {
  const folders = FLAT_DIRECTORIES.map((d) => path.join(ENRICHER_ROOT, d));
  for (const nested of NESTED_DIRECTORIES) {
    const base = path.join(ENRICHER_ROOT, nested);
    for (const entry of fs.readdirSync(base, { withFileTypes: true })) {
      if (entry.isDirectory()) folders.push(path.join(base, entry.name));
    }
  }
  return folders;
}

interface IEnricherFile {
  folder: string;
  file: string;
  className: string;
}

function enricherFilesIn(folder: string): IEnricherFile[] {
  return fs.readdirSync(folder)
    .filter((f) => f.endsWith(".ts") && f !== "_module.ts")
    .map((file) => {
      const declaration = CLASS_DECLARATION.exec(fs.readFileSync(path.join(folder, file), "utf8"));
      // abstract bases are extended by a direct sibling import and never resolved
      // by name, so _linkBuilder deliberately keeps them out of the barrel
      if (!declaration || declaration[1]) return null;
      return { folder, file, className: declaration[2] };
    })
    .filter((entry): entry is IEnricherFile => entry !== null);
}

const FOLDERS = enricherFolders();
const FILES = FOLDERS.flatMap((folder) => enricherFilesIn(folder));

function relative(entry: IEnricherFile): string {
  return path.relative(ENRICHER_ROOT, path.join(entry.folder, entry.file));
}

describe("enricher barrels", () => {
  it("finds the enricher folders and files to check", () => {
    // a glob that silently matched nothing would make every test below vacuous
    expect(FOLDERS.length).toBeGreaterThan(100);
    expect(FILES.length).toBeGreaterThan(1000);
  });

  it("gives every folder a generated barrel", () => {
    const missing = FOLDERS
      .filter((folder) => !fs.existsSync(path.join(folder, "_module.ts")))
      .map((folder) => path.relative(ENRICHER_ROOT, folder));
    expect(missing).toEqual([]);
  });

  it("names every enricher file after the class it declares", () => {
    // the factory matches enrichers to features by name; _linkBuilder only warns
    const mismatches = FILES
      .filter((entry) => !path.basename(entry.file, ".ts").includes(entry.className))
      .map((entry) => `${relative(entry)} declares class ${entry.className}`);
    expect(mismatches).toEqual([]);
  });

  it("exports every enricher class from its sibling barrel", () => {
    const exportsByFolder = new Map<string, Set<string>>();
    for (const folder of FOLDERS) {
      const barrelPath = path.join(folder, "_module.ts");
      if (!fs.existsSync(barrelPath)) continue;
      const barrel = fs.readFileSync(barrelPath, "utf8");
      exportsByFolder.set(folder, new Set([...barrel.matchAll(BARREL_EXPORT)].map((m) => m[1])));
    }

    // a stale barrel here means the enricher never resolves and the feature
    // silently falls back to Generic - run `npm run link`
    const unexported = FILES
      .filter((entry) => !exportsByFolder.get(entry.folder)?.has(entry.className))
      .map((entry) => `${relative(entry)} (${entry.className})`);
    expect(unexported).toEqual([]);
  });

  it("keeps abstract bases out of the barrels", () => {
    // exporting one puts an `abstract new (...)` into the enricher lookup maps,
    // which are typed as concrete constructors, and fails the typecheck
    const abstracts: string[] = [];
    for (const folder of FOLDERS) {
      const barrelPath = path.join(folder, "_module.ts");
      if (!fs.existsSync(barrelPath)) continue;
      const exported = new Set([...fs.readFileSync(barrelPath, "utf8").matchAll(BARREL_EXPORT)].map((m) => m[1]));
      for (const file of fs.readdirSync(folder).filter((f) => f.endsWith(".ts") && f !== "_module.ts")) {
        const declaration = CLASS_DECLARATION.exec(fs.readFileSync(path.join(folder, file), "utf8"));
        if (declaration?.[1] && exported.has(declaration[2])) {
          abstracts.push(`${path.relative(ENRICHER_ROOT, barrelPath)} exports abstract ${declaration[2]}`);
        }
      }
    }
    expect(abstracts).toEqual([]);
  });

  it("exports nothing from a barrel that has no matching source file", () => {
    const orphans: string[] = [];
    for (const folder of FOLDERS) {
      const barrelPath = path.join(folder, "_module.ts");
      if (!fs.existsSync(barrelPath)) continue;
      const declared = new Set(enricherFilesIn(folder).map((entry) => entry.className));
      for (const match of fs.readFileSync(barrelPath, "utf8").matchAll(BARREL_EXPORT)) {
        if (!declared.has(match[1])) {
          orphans.push(`${path.relative(ENRICHER_ROOT, barrelPath)} exports ${match[1]}`);
        }
      }
    }
    expect(orphans).toEqual([]);
  });
});
