import resolveFoundryMacro from "../../src/lib/MacroReference";

describe("resolveFoundryMacro", () => {
  const originalMacros = (globalThis as any).game.macros;
  const originalFromUuid = (globalThis as any).fromUuid;

  const worldMacro = { documentName: "Macro", name: "Trap Springs", uuid: "Macro.world1" };
  const packMacro = { documentName: "Macro", name: "Pack Macro", uuid: "Compendium.world.macros.Macro.pack1" };
  const packItem = { documentName: "Item", name: "Not A Macro", uuid: "Compendium.world.items.Item.item1" };
  const byUuid: Record<string, unknown> = {
    [worldMacro.uuid]: worldMacro,
    [packMacro.uuid]: packMacro,
    [packItem.uuid]: packItem,
  };

  beforeEach(() => {
    (globalThis as any).fromUuid = vi.fn(async (uuid: string) => byUuid[uuid] ?? null);
    (globalThis as any).game.macros = { find: (fn: (m: unknown) => boolean) => [worldMacro].find(fn) };
  });

  afterEach(() => {
    (globalThis as any).game.macros = originalMacros;
    (globalThis as any).fromUuid = originalFromUuid;
  });

  it("returns null for a blank reference without looking anything up", async () => {
    expect(await resolveFoundryMacro("")).toBeNull();
    expect(await resolveFoundryMacro("   ")).toBeNull();
    expect(await resolveFoundryMacro(undefined)).toBeNull();
    expect((globalThis as any).fromUuid).not.toHaveBeenCalled();
  });

  it("resolves a world macro uuid", async () => {
    expect(await resolveFoundryMacro("Macro.world1")).toBe(worldMacro);
  });

  it("resolves a compendium macro uuid in place", async () => {
    expect(await resolveFoundryMacro("Compendium.world.macros.Macro.pack1")).toBe(packMacro);
  });

  it("unwraps a pasted document link", async () => {
    expect(await resolveFoundryMacro("@UUID[Compendium.world.macros.Macro.pack1]{Pack Macro}")).toBe(packMacro);
    expect(await resolveFoundryMacro(" @UUID[Macro.world1] ")).toBe(worldMacro);
  });

  it("finds a world macro by name", async () => {
    expect(await resolveFoundryMacro("Trap Springs")).toBe(worldMacro);
    expect((globalThis as any).fromUuid).not.toHaveBeenCalled();
  });

  it("rejects a uuid that points at another document type", async () => {
    expect(await resolveFoundryMacro("Compendium.world.items.Item.item1")).toBeNull();
  });

  it("falls back to the name lookup when a uuid-shaped value resolves to nothing", async () => {
    const dotted = { documentName: "Macro", name: "Macro.Helper", uuid: "Macro.dotted" };
    (globalThis as any).game.macros = { find: (fn: (m: unknown) => boolean) => [dotted].find(fn) };
    expect(await resolveFoundryMacro("Macro.Helper")).toBe(dotted);
  });

  it("survives fromUuid throwing", async () => {
    (globalThis as any).fromUuid = vi.fn(async () => {
      throw new Error("bad uuid");
    });
    expect(await resolveFoundryMacro("Compendium.missing.pack.Macro.x")).toBeNull();
  });
});
