// Loads the real module entry (src/index.ts) the way Foundry does, with nothing mocked but the
// globals. A static import that closes a module cycle (an app importing something that patches a
// parser class while that class is still evaluating) only crashes the webpack release build: the
// esbuild dev build orders modules differently and hides it. Loading the entry here reproduces
// the release order, so such a cycle fails this test instead of Foundry's page load.
//
// Module evaluation touches many Foundry and dnd5e globals the shared mocks do not provide, so any
// missing path resolves to a stub that survives reads, calls, construction and `extends`. The
// shared mocks stay in front, so code that reads a real mocked value still gets it.

/** A value that survives any property read, call, construction or `extends` during module load. */
function universal(): any {
  const target = function stub() {} as any;
  return new Proxy(target, {
    get(t, prop) {
      if (prop === "prototype") return t.prototype;
      if (prop === Symbol.toPrimitive) return () => "";
      if (prop === Symbol.iterator) return function* () {};
      if (prop === "then") return undefined;
      if (prop === "toJSON") return () => ({});
      if (prop in t) return t[prop];
      return universal();
    },
    apply: () => universal(),
    construct: () => universal(),
  });
}

/** The existing mock, with any missing path filled by a universal stub. */
function lenient(real: any): any {
  if (real === null || (typeof real !== "object" && typeof real !== "function")) return real;
  return new Proxy(real, {
    get(t, prop, receiver) {
      if (prop in t) {
        const value = Reflect.get(t, prop, receiver);
        return typeof value === "object" && value !== null ? lenient(value) : value;
      }
      if (typeof prop === "symbol" || prop === "then") return undefined;
      return universal();
    },
  });
}

for (const name of ["dnd5e", "foundry", "CONFIG", "game", "ui", "Hooks", "CONST"]) {
  (globalThis as any)[name] = lenient((globalThis as any)[name] ?? {});
}
for (const name of ["AdventureImporter", "PIXI", "io", "socketlib", "libWrapper", "DAE", "MidiQOL"]) {
  (globalThis as any)[name] ??= universal();
}

describe("module entry first-load smoke", () => {
  it("evaluates src/index.ts without a module cycle hitting an uninitialised binding", async () => {
    await expect(import("../../src/index")).resolves.toBeDefined();
  });
});
