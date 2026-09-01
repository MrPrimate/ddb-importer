// Reproduces tsserver's per-file check order, which resolves fvtt-types' recursive generics
// differently to a whole-program `tsc` run. See docs/editor-only-type-errors.md.
import ts from "typescript";
import path from "node:path";
import process from "node:process";

const cwd = process.cwd();
const args = process.argv.slice(2);
const parsed = ts.getParsedCommandLineOfConfigFile(path.join(cwd, "tsconfig.json"), {}, {
  useCaseSensitiveFileNames: true,
  getCurrentDirectory: ts.sys.getCurrentDirectory,
  readDirectory: ts.sys.readDirectory,
  fileExists: ts.sys.fileExists,
  readFile: ts.sys.readFile,
  onUnRecoverableConfigFileDiagnostic: (d) => {
    throw new Error(ts.flattenDiagnosticMessageText(d.messageText, " "));
  },
});

// --all sweeps every src file; --no-enrichers skips the (clean) enricher tree; otherwise the
// explicit paths given on the command line are the seeds.
const explicit = args.filter((a) => !a.startsWith("--")).map((a) => path.resolve(cwd, a));
let seeds = explicit;
if (args.includes("--all")) {
  seeds = parsed.fileNames.filter((f) => f.includes("/src/") && f.endsWith(".ts") && !f.endsWith(".d.ts"));
}
if (args.includes("--no-enrichers")) seeds = seeds.filter((f) => !f.includes("/parser/enrichers/"));
const programWide = args.includes("--program");
// --seq checks all listed seeds inside ONE program/checker, in order: earlier files warm the
// type caches for later ones, which is how a warming-file bisection is run.
const sequential = args.includes("--seq");

let old;
let dirty = 0;
let total = 0;
// --findwarm <probe>: binary-search the minimal prefix of program file order whose checking
// warms the type caches enough that the probe then checks clean. Prints the boundary file.
if (args.includes("--findwarm")) {
  const probe = explicit[0];
  const base = ts.createProgram(parsed.fileNames, parsed.options);
  const all = base.getSourceFiles().map((f) => f.fileName);
  const probeDirty = (prefixEnd) => {
    const program = ts.createProgram(parsed.fileNames, parsed.options, undefined, base);
    for (let i = 0; i < prefixEnd; i += 1) {
      const f = program.getSourceFile(all[i]);
      if (f && f.fileName !== probe) program.getSemanticDiagnostics(f);
    }
    const sf = program.getSourceFile(probe);
    const n = program.getSemanticDiagnostics(sf).length;
    process.stdout.write(`prefix ${prefixEnd}: probe diagnostics ${n}\n`);
    return n > 0;
  };
  if (probeDirty(all.length)) {
    process.stdout.write("probe still dirty after full warm-up - no warming prefix exists\n");
    process.exit(1);
  }
  let lo = 0; // dirty
  let hi = all.length; // clean
  while (hi - lo > 1) {
    const mid = Math.floor((lo + hi) / 2);
    if (probeDirty(mid)) lo = mid;
    else hi = mid;
  }
  process.stdout.write(`warming file (first prefix that cleans the probe ends at index ${hi - 1}):\n`);
  process.stdout.write(`${all[hi - 1]}\n`);
  process.exit(0);
}

let sharedProgram;
for (const seed of seeds) {
  const program = sequential
    ? (sharedProgram ??= ts.createProgram(parsed.fileNames, parsed.options))
    : ts.createProgram(parsed.fileNames, parsed.options, undefined, old);
  const sf = program.getSourceFile(seed);
  if (!sf) {
    process.stdout.write(`?? not in program: ${seed}\n`);
    continue;
  }
  const diags = program.getSemanticDiagnostics(sf); // seeded FIRST - this is the point
  const extra = programWide ? ts.getPreEmitDiagnostics(program).length : null;
  old = program;
  total += diags.length;
  if (diags.length) dirty += 1;
  const rel = seed.replace(`${cwd}/`, "");
  process.stdout.write(`${diags.length ? "ERR" : "ok "} ${String(diags.length).padStart(3)} ${rel}${extra === null ? "" : ` (program-wide ${extra})`}\n`);
  for (const d of diags) {
    const line = sf.getLineAndCharacterOfPosition(d.start).line + 1;
    process.stdout.write(`      ${rel}:${line}  TS${d.code}  ${ts.flattenDiagnosticMessageText(d.messageText, " ").split("\n")[0].slice(0, 160)}\n`);
  }
}
process.stdout.write(`\nseeds: ${seeds.length}  dirty files: ${dirty}  diagnostics: ${total}\n`);
