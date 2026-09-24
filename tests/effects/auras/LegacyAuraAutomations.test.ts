import * as AuraAutomations from "../../../src/effects/auras/_module";

describe("legacy Active Auras entry points", () => {
  afterEach(() => vi.restoreAllMocks());

  it.each(["DamageOnEntry", "ConditionOnEntry", "AuraOnly"] as const)("%s still resolves and returns nothing", (name) => {
    const fn = AuraAutomations[name];
    expect(typeof fn).toBe("function");
    const item = { uuid: `Actor.a.Item.${name}`, name: "Cloudkill" } as unknown as Item.Implementation;
    expect(fn({ item, args: [{ tag: "OnUse", macroPass: "preActiveEffects" }] })).toBeUndefined();
  });

  it("warns once per document", () => {
    const warn = vi.spyOn(ui.notifications!, "warn");
    const item = { uuid: "Actor.a.Item.grease", name: "Grease" } as unknown as Item.Implementation;

    AuraAutomations.ConditionOnEntry({ item, args: ["on"] });
    AuraAutomations.ConditionOnEntry({ item, args: ["off"] });
    AuraAutomations.ConditionOnEntry({ item: { uuid: "Actor.a.Item.web", name: "Web" } as unknown as Item.Implementation, args: ["on"] });

    expect(warn).toHaveBeenCalledTimes(2);
  });

  it("tolerates a call with no context", () => {
    expect(() => AuraAutomations.AuraOnly()).not.toThrow();
  });
});
