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

// DDB catalogue weapons with no dnd5e key keep their DDB keys ("huntingrifle") on masteries and
// base items, so they need a label dnd5e's Trait.keyLabel can find without a base item to link.
// Silvered and wooden copies of core weapons resolve to the core key and get none, and only
// weapons munched into the items compendium are labelled.
describe("DDBRuleJournalFactory.registerWeaponLabels", () => {
  const realGetCompendiumType = CompendiumHelper.getCompendiumType;
  const realTraits = CONFIG.DND5E.traits;
  const realWeaponIds = CONFIG.DND5E.weaponIds;
  const realWeapons = CONFIG.DDB.weapons;

  beforeEach(() => {
    (CONFIG.DND5E as any).traits = { weapon: { configKey: "weaponProficiencies" } };
    (CONFIG.DND5E as any).weaponIds = { shortsword: "abc", handcrossbow: "def" };
    CONFIG.DDB.weapons = [
      { id: 1, entityTypeId: 1, name: "Shortsword", categoryId: 2 },
      { id: 2, entityTypeId: 1, name: "Crossbow, Hand", categoryId: 2 },
      { id: 3, entityTypeId: 1, name: "Shortsword, Silver", categoryId: 2 },
      { id: 4, entityTypeId: 1, name: "Dart, Wooden", categoryId: 1 },
      { id: 5, entityTypeId: 1, name: "Rifle, Hunting", categoryId: 3 },
      { id: 6, entityTypeId: 1, name: "Shortbow (Wooden Arrows)", categoryId: 1 },
      { id: 7, entityTypeId: 1, name: "Tommybow, hand", categoryId: 2 },
    ];
    const index = [
      { name: "Rifle, Hunting", type: "weapon" },
      { name: "Shortsword, Silver", type: "weapon" },
      // a same-named non-weapon does not count as the weapon being munched
      { name: "Tommybow, hand", type: "loot" },
    ];
    (CompendiumHelper as any).getCompendiumType = () => ({ getIndex: async () => index, index });
  });

  afterEach(() => {
    (CompendiumHelper as any).getCompendiumType = realGetCompendiumType;
    (CONFIG.DND5E as any).traits = realTraits;
    (CONFIG.DND5E as any).weaponIds = realWeaponIds;
    CONFIG.DDB.weapons = realWeapons;
    delete (CONFIG.DND5E as any)[DDBRuleJournalFactory.WEAPON_LABELS_CONFIG_KEY];
  });

  it("labels munched catalogue weapons dnd5e has no key for, skipping material copies", async () => {
    await DDBRuleJournalFactory.registerWeaponLabels();
    expect((CONFIG.DND5E as any)[DDBRuleJournalFactory.WEAPON_LABELS_CONFIG_KEY]).toEqual({
      huntingrifle: "Rifle, Hunting",
    });
  });

  it("picks up a weapon munched after an earlier registration", async () => {
    await DDBRuleJournalFactory.registerWeaponLabels();
    (CompendiumHelper as any).getCompendiumType = () => {
      const index = [{ name: "Rifle, Hunting", type: "weapon" }, { name: "Tommybow, hand", type: "weapon" }];
      return { getIndex: async () => index, index };
    };
    await DDBRuleJournalFactory.registerWeaponLabels();
    expect((CONFIG.DND5E as any)[DDBRuleJournalFactory.WEAPON_LABELS_CONFIG_KEY]).toEqual({
      huntingrifle: "Rifle, Hunting",
      handtommybow: "Tommybow, hand",
    });
    expect((CONFIG.DND5E.traits.weapon as any).children).toEqual({ ddb: DDBRuleJournalFactory.WEAPON_LABELS_CONFIG_KEY });
  });

  it("registers nothing when the items compendium is missing", async () => {
    (CompendiumHelper as any).getCompendiumType = () => undefined;
    await DDBRuleJournalFactory.registerWeaponLabels();
    expect((CONFIG.DND5E as any)[DDBRuleJournalFactory.WEAPON_LABELS_CONFIG_KEY]).toBeUndefined();
    expect((CONFIG.DND5E.traits.weapon as any).children).toBeUndefined();
  });

  it("adds the labels as a children table that is not a proficiency category", async () => {
    await DDBRuleJournalFactory.registerWeaponLabels();
    const children = (CONFIG.DND5E.traits.weapon as any).children;
    expect(children).toEqual({ ddb: DDBRuleJournalFactory.WEAPON_LABELS_CONFIG_KEY });
    expect(Object.keys(children).some((key) => ["sim", "mar"].includes(key))).toBe(false);
  });

  it("keeps existing children tables", async () => {
    (CONFIG.DND5E.traits.weapon as any).children = { other: "otherLabels" };
    await DDBRuleJournalFactory.registerWeaponLabels();
    expect((CONFIG.DND5E.traits.weapon as any).children).toEqual({
      other: "otherLabels",
      ddb: DDBRuleJournalFactory.WEAPON_LABELS_CONFIG_KEY,
    });
  });
});
