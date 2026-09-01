// Reproduces tsserver's per-file check order, which resolves fvtt-types' recursive generics
// differently to a whole-program `tsc` run. See docs/editor-only-type-errors.md.
//
// Every seed is checked by a FRESH program/checker (that is the point - it models "this is the
// first file the editor checked"), so a sweep costs ~4s per seed. Seeds are sharded across
// worker threads (--jobs=N, default bounded by cores AND free memory) to bring a full sweep down
// to a few minutes. --changed[=ref] seeds only the files changed against a git ref.
import ts from "typescript";
import path from "node:path";
import process from "node:process";
import os from "node:os";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { Worker, isMainThread, parentPort, workerData } from "node:worker_threads";

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
// --changed[=<git ref>] seeds the .ts files changed against a ref (default HEAD, i.e. the working
// tree) plus untracked ones: the cheap per-change variant of the sweep.
const changedArg = args.find((a) => a.startsWith("--changed"));
if (changedArg) {
  const ref = changedArg.includes("=") ? changedArg.split("=")[1] : "HEAD";
  const out = execSync(`git diff --name-only ${ref} -- src; git ls-files --others --exclude-standard -- src`, { cwd, encoding: "utf8" });
  const changed = new Set(out.split("\n").filter((f) => f.endsWith(".ts") && !f.endsWith(".d.ts")).map((f) => path.resolve(cwd, f)));
  seeds = parsed.fileNames.filter((f) => changed.has(f));
}
const programWide = args.includes("--program");
// Each fresh program peaks around 3 GB, so the default worker count is bounded by free memory
// as well as cores; override with --jobs=N.
const jobsArg = args.find((a) => a.startsWith("--jobs="));
const defaultJobs = Math.min(Math.floor(os.availableParallelism() / 2), Math.floor(os.freemem() / 3e9), 8);
const jobs = Math.max(1, jobsArg ? Number(jobsArg.split("=")[1]) : defaultJobs);
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

/** Check one seed first in a fresh program (or the shared one in --seq mode) and format the result. */
function checkSeed(seed, oldProgram, shared) {
  const program = shared ?? ts.createProgram(parsed.fileNames, parsed.options, undefined, oldProgram);
  const sf = program.getSourceFile(seed);
  const rel = seed.replace(`${cwd}/`, "");
  if (!sf) return { program, count: 0, text: `?? not in program: ${rel}\n` };
  const diags = program.getSemanticDiagnostics(sf); // seeded FIRST - this is the point
  const extra = programWide ? ts.getPreEmitDiagnostics(program).length : null;
  let text = `${diags.length ? "ERR" : "ok "} ${String(diags.length).padStart(3)} ${rel}${extra === null ? "" : ` (program-wide ${extra})`}\n`;
  for (const d of diags) {
    const line = sf.getLineAndCharacterOfPosition(d.start).line + 1;
    text += `      ${rel}:${line}  TS${d.code}  ${ts.flattenDiagnosticMessageText(d.messageText, " ").split("\n")[0].slice(0, 160)}\n`;
  }
  return { program, count: diags.length, text };
}

if (!isMainThread) {
  // worker: check the shard in order, reusing the previous program's parsed files
  let previous;
  for (const seed of workerData.seeds) {
    const result = checkSeed(seed, previous);
    previous = result.program;
    parentPort.postMessage({ seed, count: result.count, text: result.text });
  }
  parentPort.postMessage({ done: true });
} else if (sequential || jobs === 1 || seeds.length <= 1) {
  let sharedProgram;
  for (const seed of seeds) {
    if (sequential) sharedProgram ??= ts.createProgram(parsed.fileNames, parsed.options);
    const result = checkSeed(seed, old, sharedProgram);
    old = result.program;
    total += result.count;
    if (result.count) dirty += 1;
    process.stdout.write(result.text);
  }
  process.stdout.write(`\nseeds: ${seeds.length}  dirty files: ${dirty}  diagnostics: ${total}\n`);
} else {
  // main: shard round-robin so each worker gets a mix of cheap and expensive files, print results
  // in seed order as they arrive so the output is stable and diffable
  const workerCount = Math.min(jobs, seeds.length);
  const shards = Array.from({ length: workerCount }, () => []);
  seeds.forEach((seed, i) => shards[i % workerCount].push(seed));
  const results = new Map();
  let next = 0;
  const flush = () => {
    while (next < seeds.length && results.has(seeds[next])) {
      const r = results.get(seeds[next]);
      total += r.count;
      if (r.count) dirty += 1;
      process.stdout.write(r.text);
      next += 1;
    }
  };
  process.stderr.write(`checking ${seeds.length} seeds on ${workerCount} workers\n`);
  let running = workerCount;
  for (const shard of shards) {
    const worker = new Worker(fileURLToPath(import.meta.url), { argv: args, workerData: { seeds: shard } });
    worker.on("message", (msg) => {
      if (msg.done) {
        running -= 1;
        if (running === 0) {
          flush();
          process.stdout.write(`\nseeds: ${seeds.length}  dirty files: ${dirty}  diagnostics: ${total}\n`);
          process.exitCode = dirty ? 1 : 0;
        }
        return;
      }
      results.set(msg.seed, msg);
      flush();
    });
    worker.on("error", (err) => {
      process.stderr.write(`worker failed: ${err.stack ?? err}\n`);
      process.exitCode = 2;
    });
  }
}
