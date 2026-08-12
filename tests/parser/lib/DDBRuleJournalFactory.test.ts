import DDBRuleJournalFactory from "../../../src/parser/lib/DDBRuleJournalFactory";
import { CompendiumHelper } from "../../../src/lib/_module";

// registerAmmunitionTypes scans the item compendium and only registers the
// publisher ammunition types the user actually has content for.
describe("DDBRuleJournalFactory.registerAmmunitionTypes", () => {
  const realGetCompendiumType = CompendiumHelper.getCompendiumType;

  function ammoEntry(name: string, overrides: Record<string, any> = {}) {
    return {
      name,
      type: "consumable",
      system: { type: { value: "ammo" }, source: {} },
      flags: { ddbimporter: { dndbeyond: { sourceCategoryId: 32 } } },
      ...overrides,
    };
  }

  function stubCompendium(index: any[] | null) {
    (CompendiumHelper as any).getCompendiumType = () =>
      index === null ? undefined : { getIndex: async () => index, index };
  }

  beforeEach(() => {
    CONFIG.DND5E.consumableTypes = { ammo: { label: "Ammunition", subtypes: { arrow: "Arrow" } } };
  });

  afterEach(() => {
    (CompendiumHelper as any).getCompendiumType = realGetCompendiumType;
  });

  it("registers a type when its item is in the compendium", async () => {
    stubCompendium([ammoEntry("Shells (10)")]);
    await DDBRuleJournalFactory.registerAmmunitionTypes();
    expect(CONFIG.DND5E.consumableTypes["ammo"].subtypes).toMatchObject({ arrow: "Arrow", shells: "Shells" });
  });

  it("registers nothing when the compendium has no matching ammunition", async () => {
    stubCompendium([ammoEntry("Arrows"), ammoEntry("Bullets (10)")]);
    await DDBRuleJournalFactory.registerAmmunitionTypes();
    expect(CONFIG.DND5E.consumableTypes["ammo"].subtypes).toEqual({ arrow: "Arrow" });
  });

  it("registers every type present and no others", async () => {
    stubCompendium([
      ammoEntry("Shells (10)"),
      ammoEntry("Cannonballs (5)"),
      ammoEntry("Portable Cannonballs"),
    ]);
    await DDBRuleJournalFactory.registerAmmunitionTypes();
    const subtypes = CONFIG.DND5E.consumableTypes["ammo"].subtypes ?? {};
    expect(subtypes["shells"]).toBe("Shells");
    expect(subtypes["cannonballs"]).toBe("Cannonballs");
    expect(subtypes["flares"]).toBeUndefined();
    expect(subtypes["shot"]).toBeUndefined();
  });

  // the source gate: an identically named item from another publisher must not
  // register the type
  it("ignores ammunition from another publisher", async () => {
    stubCompendium([
      ammoEntry("Shells (10)", { flags: { ddbimporter: { dndbeyond: { sourceCategoryId: 26 } } } }),
    ]);
    await DDBRuleJournalFactory.registerAmmunitionTypes();
    expect(CONFIG.DND5E.consumableTypes["ammo"].subtypes).toEqual({ arrow: "Arrow" });
  });

  it("resolves the publisher from system.source.book when the flag is absent", async () => {
    stubCompendium([
      ammoEntry("Flares (5)", { flags: {}, system: { type: { value: "ammo" }, source: { book: "TGC" } } }),
    ]);
    await DDBRuleJournalFactory.registerAmmunitionTypes();
    expect(CONFIG.DND5E.consumableTypes["ammo"].subtypes?.["flares"]).toBe("Flares");
  });

  it("ignores non ammunition documents", async () => {
    stubCompendium([
      ammoEntry("Shell Coin", { type: "equipment", system: { type: { value: "trinket" } } }),
      ammoEntry("Shells of Holding", { system: { type: { value: "potion" } } }),
    ]);
    await DDBRuleJournalFactory.registerAmmunitionTypes();
    expect(CONFIG.DND5E.consumableTypes["ammo"].subtypes).toEqual({ arrow: "Arrow" });
  });

  it("does not overwrite an already registered subtype", async () => {
    CONFIG.DND5E.consumableTypes["ammo"].subtypes!["shells"] = "Existing Shells";
    stubCompendium([ammoEntry("Shells (10)")]);
    await DDBRuleJournalFactory.registerAmmunitionTypes();
    expect(CONFIG.DND5E.consumableTypes["ammo"].subtypes?.["shells"]).toBe("Existing Shells");
  });

  it("does not throw when the compendium is missing", async () => {
    stubCompendium(null);
    await expect(DDBRuleJournalFactory.registerAmmunitionTypes()).resolves.toBeUndefined();
    expect(CONFIG.DND5E.consumableTypes["ammo"].subtypes).toEqual({ arrow: "Arrow" });
  });
});
