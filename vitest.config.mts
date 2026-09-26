import { defineConfig, type Plugin } from "vitest/config";
import fs from "node:fs";
import path from "node:path";

/**
 * Vitest writes every transformed module to `<os.tmpdir()>/<nanoid>/<environment>/` (~35 MB for
 * this repo). On a tmpfs /tmp that is RAM, and a run that is killed never deletes it. Pointing
 * os.tmpdir() at a gitignored folder in the repo keeps those copies on disk instead. This has to
 * happen here: createVitest resolves this config before `new Vitest()` computes its tmp path.
 * Forked test workers inherit the variable, so tests using os.tmpdir() land here too.
 */
const VITEST_TMP = path.resolve(import.meta.dirname, ".vitest-tmp");
fs.mkdirSync(VITEST_TMP, { recursive: true });
process.env.TMPDIR = VITEST_TMP;
if (process.platform === "win32") {
  process.env.TEMP = VITEST_TMP;
  process.env.TMP = VITEST_TMP;
}

// A run records its pid next to its tmp dir; dirs with no pid file get this long before they count
// as leftovers, since a starting run may create one before the pid is written.
const UNMARKED_GRACE_MS = 10 * 60 * 1000;

function isAlive(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    return (error as NodeJS.ErrnoException).code === "EPERM";
  }
}

/**
 * Removes tmp dirs left by runs that were killed or crashed. Several sessions can run Vitest at
 * once, so only dirs whose owning process is gone are removed.
 */
function sweepStaleTmpDirs() {
  for (const entry of fs.readdirSync(VITEST_TMP, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const dir = path.join(VITEST_TMP, entry.name);
    const pidFile = `${dir}.pid`;
    try {
      if (fs.existsSync(pidFile)) {
        if (isAlive(Number(fs.readFileSync(pidFile, "utf8")))) continue;
      } else if (Date.now() - fs.statSync(dir).mtimeMs < UNMARKED_GRACE_MS) {
        continue;
      }
      fs.rmSync(dir, { recursive: true, force: true });
      fs.rmSync(pidFile, { force: true });
    } catch {
      // another run swept it first
    }
  }
}

sweepStaleTmpDirs();

/**
 * Vitest 5.0.x (through 5.0.2) never deletes the tmp dir of a single-project config: the basic
 * project shares the root `vitest._tmpDir` fetcher but its close() removes its own unused
 * `project.tmpDir`, so even a clean run leaks one. 4.1.x passed `_tmpDir` through and did not leak.
 * `_tmpDir` is internal, so this degrades to a no-op if a later release renames it.
 *
 * Runs that never reach close() are covered too. Vitest turns SIGINT/SIGTERM into process.exit()
 * one tick later, but its handlers are `once`, and a second signal in that window (GNU `timeout`
 * signals the child and then its process group) kills the process before "exit" fires, so signals
 * remove the dir synchronously. SIGKILL and hard crashes skip all of this; sweepStaleTmpDirs covers
 * those on the next run.
 */
function cleanVitestTmpDir(): Plugin {
  const handled = new Set<string>();
  return {
    name: "ddb-clean-vitest-tmp-dir",
    configureVitest({ vitest }) {
      const tmpDir = (vitest as unknown as { _tmpDir?: unknown })._tmpDir;
      if (typeof tmpDir !== "string" || handled.has(tmpDir)) return;
      handled.add(tmpDir);
      fs.writeFileSync(`${tmpDir}.pid`, String(process.pid));

      const remove = () => {
        fs.rmSync(tmpDir, { recursive: true, force: true });
        fs.rmSync(`${tmpDir}.pid`, { force: true });
      };
      const signals = ["SIGINT", "SIGTERM"] as const;
      const signalHandlers = signals.map((signal) => {
        // With no Vitest handler present, adding a listener would swallow the signal, so re-raise it.
        const reRaise = process.listenerCount(signal) === 0;
        const handler = () => {
          remove();
          if (reRaise) process.kill(process.pid, signal);
        };
        process.once(signal, handler);
        return [signal, handler] as const;
      });
      process.once("exit", remove);

      vitest.onClose(() => {
        for (const [signal, handler] of signalHandlers) process.off(signal, handler);
        process.off("exit", remove);
        remove();
      });
    },
  };
}

export default defineConfig({
  plugins: [cleanVitestTmpDir()],
  test: {
    /**
     * Persists transformed modules in node_modules/.vitest-cache (on disk, not tmpfs). Entries are
     * keyed on each module's own content plus this config file and the lockfile, but NOT on
     * tsconfig.json, which the oxc transform reads (target, class field semantics). After changing
     * tsconfig compiler options run `npx vitest --clearCache`. The cache has no eviction; deleting
     * the directory is always safe.
     */
    fsModuleCache: true,
    globals: true,
    include: ["tests/**/*.test.ts"],
    setupFiles: ["tests/_setup/foundryMocks.ts"],
    environment: "node",
    coverage: {
      provider: "v8",
      include: ["src/**/*.ts", "src/**/*.mjs", "src/**/*.js"],
      exclude: ["src/types/**", "**/vendor/**", "src/**/_module.ts"],
      reporter: ["text-summary", "html", "lcov"],
    },
  },
  resolve: {
    alias: {
      "@client": path.resolve(import.meta.dirname, "foundry/client"),
      "@common": path.resolve(import.meta.dirname, "foundry/common"),
    },
  },
});
