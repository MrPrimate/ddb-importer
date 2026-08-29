// Mock deep dependency chain for DDBItem
vi.mock("../../../src/parser/enrichers/mixins/DDBEnricherFactoryMixin", () => ({
  default: class {},
}));
vi.mock("../../../src/parser/activities/mixins/DDBActivityFactoryMixin", () => ({
  default: class {
    additionalActivities: any[] = [];
    data: any = null;
    activities: any[] = [];
    activityTypes: any[] = [];
    documentType: any = null;
    useMidiAutomations = false;
  },
}));
vi.mock("../../../src/parser/enrichers/DDBItemEnricher", () => ({
  default: class { init() {} load() {} },
}));
vi.mock("../../../src/parser/activities/_module", () => ({
  DDBItemActivity: class {},
}));
vi.mock("../../../src/parser/item/MagicItemMaker", () => ({
  default: {},
}));
vi.mock("../../../src/effects/restrictions", () => ({
  addRestrictionFlags: vi.fn(),
}));

import DDBItem from "../../../src/parser/item/DDBItem";
import { JEWEL_OF_THREE_PRAYERS, NO_CHARGE_VESTIGE } from "../../_fixtures/ddb/vestiges";

// =============================================================================
// getPublisherAmmunitionType* - Mage Hand Press ammunition, gated on the DDB
// source category so nothing outside that publisher is re-typed
// =============================================================================
describe("DDBItem publisher ammunition", () => {
  const MHP = 32;

  describe("getPublisherAmmunitionTypeByName", () => {
    it.each([
      // DDB ships count suffixes and prefixes
      ["Shells (10)", "shells"],
      ["Shot (10)", "shot"],
      ["Cannonballs (5)", "cannonballs"],
      ["Flares (5)", "flares"],
      ["Portable Cannonballs", "cannonballs"],
      // the module may append a legacy postfix
      ["Shells (10) (Legacy)", "shells"],
    ])("matches %s as %s", (name, expected) => {
      expect(DDBItem.getPublisherAmmunitionTypeByName(name, MHP)).toBe(expected);
    });

    // word boundaries, so a substring hit is not enough
    it.each(["Seashell", "Shell Coin", "Shotgun", "Flaregun"])("does not match %s", (name) => {
      expect(DDBItem.getPublisherAmmunitionTypeByName(name, MHP)).toBeNull();
    });

    it("returns null for the MHP bullets, which are the existing firearmBullet", () => {
      expect(DDBItem.getPublisherAmmunitionTypeByName("Bullets (10)", MHP)).toBeNull();
    });

    it("returns null for a non publisher source category", () => {
      expect(DDBItem.getPublisherAmmunitionTypeByName("Shells (10)", 2)).toBeNull();
      expect(DDBItem.getPublisherAmmunitionTypeByName("Cannonball", 249)).toBeNull();
      expect(DDBItem.getPublisherAmmunitionTypeByName("Shells (10)", null)).toBeNull();
    });

    it("returns null for an empty name", () => {
      expect(DDBItem.getPublisherAmmunitionTypeByName(null, MHP)).toBeNull();
      expect(DDBItem.getPublisherAmmunitionTypeByName("", MHP)).toBeNull();
    });
  });

  describe("getPublisherAmmunitionTypeByWeapon", () => {
    it.each([
      ["Double-Barrel Shotgun", "shells"],
      ["Pump Shotgun", "shells"],
      ["Blunderbuss", "shot"],
      ["Flare Gun", "flares"],
    ])("maps %s to %s", (weaponType, expected) => {
      expect(DDBItem.getPublisherAmmunitionTypeByWeapon(weaponType, MHP)).toBe(expected);
    });

    // handled by src/parser/enrichers/item/Cannon.ts, not the weapon table
    it("leaves the Cannon to its enricher", () => {
      expect(DDBItem.getPublisherAmmunitionTypeByWeapon("Cannon", MHP)).toBeNull();
    });

    it.each(["Handgun", "Magnum", "Gatling Gun", "Sniper Rifle", "Submachine Gun"])(
      "leaves %s to firearmBullet",
      (weaponType) => {
        expect(DDBItem.getPublisherAmmunitionTypeByWeapon(weaponType, MHP)).toBeNull();
      },
    );

    it("does not re-type a non publisher weapon of the same name", () => {
      expect(DDBItem.getPublisherAmmunitionTypeByWeapon("Shotgun", MHP)).toBeNull();
      expect(DDBItem.getPublisherAmmunitionTypeByWeapon("Pump Shotgun", 2)).toBeNull();
    });
  });
});

// =============================================================================
// inferAmmunitionType - name based fallback for weapons and ammunition with no
// DICTIONARY.actor.proficiencies row (177 of DDB's 229 weapon types)
// =============================================================================
describe("DDBItem.inferAmmunitionType", () => {
  it.each([
    // the reported case, plus other third party firearms
    ["Gatling Gun", "firearmBullet"],
    ["Magnum", "firearmBullet"],
    ["Submachine Gun", "firearmBullet"],
    ["Blunderbuss (Steinhardt's)", "firearmBullet"],
    ["Palm Pistol (Exandria)", "firearmBullet"],
    ["Magitech Revolver", "firearmBullet"],
    ["Musket (Wooden Bullets)", "firearmBullet"],
    ["Bad News (Exandria)", "firearmBullet"],
    // energy weapons
    ["Laser Pistol", "energyCell"],
    ["Blaster", "energyCell"],
    ["Antimatter Rifle", "energyCell"],
    // conventional ranged weapons
    ["Repeater Crossbow, Heavy", "crossbowBolt"],
    ["Light Crossbow (Wooden Bolts)", "crossbowBolt"],
    ["Composite Longbow", "arrow"],
    ["Shortbow (Wooden Arrows)", "arrow"],
    ["Tommybow, heavy", "arrow"],
    ["Hoopak", "slingBullet"],
    ["Repeater Needler", "blowgunNeedle"],
  ])("infers %s as %s", (name, expected) => {
    expect(DDBItem.inferAmmunitionType(name)).toBe(expected);
  });

  it.each([
    ["Bullets, Renaissance", "firearmBullet"],
    ["Energy Cells, +2", "energyCell"],
    ["Sling Bullets", "slingBullet"],
    ["Crossbow Bolts", "crossbowBolt"],
    ["Blowgun Needles", "blowgunNeedle"],
    ["Unbreakable Arrow", "arrow"],
    // plausible third party ammunition names with no dictionary row
    ["Shotgun Shells", "firearmBullet"],
    ["Cartridges", "firearmBullet"],
    ["Buckshot", "firearmBullet"],
  ])("infers ammunition item %s as %s", (name, expected) => {
    expect(DDBItem.inferAmmunitionType(name)).toBe(expected);
  });

  // the dictionary list is ordered and first match wins
  it("prefers sling over the firearm patterns", () => {
    expect(DDBItem.inferAmmunitionType("Slingshot")).toBe("slingBullet");
  });

  it("prefers crossbow over bow", () => {
    expect(DDBItem.inferAmmunitionType("Repeater Crossbow")).toBe("crossbowBolt");
  });

  it("returns null for a melee weapon name", () => {
    expect(DDBItem.inferAmmunitionType("Ulfberht Blade")).toBeNull();
  });

  it("returns the first text that matches", () => {
    expect(DDBItem.inferAmmunitionType("Ulfberht Blade", "Gatling Gun")).toBe("firearmBullet");
  });

  it("skips empty and nullish texts", () => {
    expect(DDBItem.inferAmmunitionType(null, undefined, "", "Longbow")).toBe("arrow");
    expect(DDBItem.inferAmmunitionType(null, undefined, "")).toBeNull();
  });
});

// =============================================================================
// getRechargeFormula - static method for parsing charge recharge formulas
// =============================================================================
describe("DDBItem.getRechargeFormula", () => {
  it("returns maxCharges for empty description", () => {
    expect(DDBItem.getRechargeFormula("", 7)).toBe("7");
  });

  it("returns maxCharges for null description", () => {
    expect(DDBItem.getRechargeFormula(null as any, 5)).toBe("5");
  });

  it("extracts dice formula from 'regains 1d6 + 1 expended charges'", () => {
    expect(DDBItem.getRechargeFormula("The staff regains 1d6 + 1 expended charges daily at dawn.", 10)).toBe("1d6 + 1");
  });

  it("extracts fixed number from 'regains 3 expended charges'", () => {
    expect(DDBItem.getRechargeFormula("It regains 3 expended charges at dawn.", 7)).toBe("3");
  });

  it("extracts last-ditch dice formula", () => {
    expect(DDBItem.getRechargeFormula("Roll 1d4 + 1 to determine recovery.", 5)).toBe("1d4 + 1");
  });

  it("returns maxCharges for next-dawn restriction with no formula", () => {
    expect(DDBItem.getRechargeFormula("This property can't be used this way again until the next dawn.", 1)).toBe("1");
  });

  it("returns maxCharges when no patterns match", () => {
    expect(DDBItem.getRechargeFormula("A magical sword of great power.", 3)).toBe("3");
  });
});

// =============================================================================
// getMagicItemResetType - static method for determining reset period
// =============================================================================
describe("DDBItem.getMagicItemResetType", () => {
  it("detects dawn reset from 'expended charges daily at dawn'", () => {
    expect(DDBItem.getMagicItemResetType("The staff regains expended charges daily at dawn.")).toBe("dawn");
  });

  it("detects dusk reset from 'expended charges each day at dusk'", () => {
    expect(DDBItem.getMagicItemResetType("It regains expended charges each day at dusk.")).toBe("dusk");
  });

  it("maps sunset to dusk", () => {
    expect(DDBItem.getMagicItemResetType("The item regains expended charges each day at sunset.")).toBe("dusk");
  });

  it.each([
    ["This property can't be used this way again until the next dawn.", "dawn"],
    ["Once this property is used, it can't be used again until the next dusk.", "dusk"],
    ["Once this property is used, it can’t be used again until the next dawn.", "dawn"],
  ])("detects prose reset in %s", (description, expected) => {
    expect(DDBItem.getMagicItemResetType(description)).toBe(expected);
  });

  it("detects long rest", () => {
    expect(DDBItem.getMagicItemResetType("You can't use this feature again until you finish a long rest.")).toBe("lr");
  });

  it("detects short or long rest as 'sr'", () => {
    expect(DDBItem.getMagicItemResetType("You can't use it again until you finish a short or long rest.")).toBe("sr");
  });

  it("returns null when no reset pattern found", () => {
    expect(DDBItem.getMagicItemResetType("A simple magical trinket.")).toBeNull();
  });
});

// =============================================================================
// _getCompendiumUses - muncher-side charge parsing. Stage-aware resolution lives
// in Vestige (see tests/parser/item/Vestige.test.ts); these pin the dispatch and
// the unstaged behaviour around it.
// =============================================================================
describe("DDBItem.prototype._getCompendiumUses", () => {
  function makeUsesMock(originalName: string, description: string, isMuncher = true) {
    const mock = Object.create(DDBItem.prototype);
    mock.isMuncher = isMuncher;
    mock.originalName = originalName;
    mock.ddbDefinition = { description };
    mock.ddbItem = { definition: mock.ddbDefinition };
    mock.actionData = {};
    return mock;
  }

  it("returns the named stage's charges and marks the activity as consuming one", () => {
    const mock = makeUsesMock("Jewel of Three Prayers (Awakened)", JEWEL_OF_THREE_PRAYERS);
    expect(mock._getCompendiumUses()).toEqual({
      max: "5",
      spent: 0,
      recovery: [{ period: "dawn", type: "recoverAll", formula: "" }],
    });
    expect(mock.actionData.consumptionValue).toBe(1);
  });

  it("never consults the stage on the character path", () => {
    const mock = makeUsesMock("Jewel of Three Prayers (Awakened)", JEWEL_OF_THREE_PRAYERS, false);
    expect(mock._getCompendiumUses()).toEqual({ spent: 0, max: null, recovery: [] });
    expect(mock.actionData.consumptionValue).toBeUndefined();
  });

  it("leaves an ordinary charged item untouched", () => {
    const description = "<p>The wand has 7 charges. It regains 1d6 + 1 expended charges daily at dawn.</p>";
    const mock = makeUsesMock("Wand of Magic Missiles", description);
    expect(mock._getCompendiumUses()).toEqual({
      max: "7",
      spent: 0,
      recovery: [{ period: "dawn", type: "formula", formula: "1d6 + 1" }],
    });
  });

  it("falls back to the default max for a staged item with no charges", () => {
    const mock = makeUsesMock("Blade of Broken Mirrors (Exalted)", NO_CHARGE_VESTIGE);
    expect(mock._getCompendiumUses("1")).toEqual({ spent: null, max: "1", recovery: [] });
  });
});

// =============================================================================
// isFirearm - DDB's Firearm property (id 33) says the ability modifier is not
// added to damage, so these weapons carry their damage on the activity
// =============================================================================
describe("DDBItem.prototype.isFirearm", () => {
  function makeWeaponMock({
    properties = [] as { name: string }[],
    parsingType = "weapon" as string | null,
  } = {}) {
    const mock = Object.create(DDBItem.prototype);
    mock.ddbDefinition = { properties };
    mock.parsingType = parsingType;
    return mock;
  }

  const FIREARM = [{ name: "Firearm" }, { name: "Ammunition" }, { name: "Reload" }];
  // the WotC firearms, which carry no Firearm property and keep their modifier
  const WOTC_FIREARM = [{ name: "Ammunition (Firearms)" }, { name: "Range" }, { name: "Loading" }];

  it("matches a weapon with the Firearm property", () => {
    expect(makeWeaponMock({ properties: FIREARM }).isFirearm).toBe(true);
  });

  it("does not match Ammunition (Firearms) weapons such as the Pistol and Musket", () => {
    expect(makeWeaponMock({ properties: WOTC_FIREARM }).isFirearm).toBe(false);
  });

  it("is false for a weapon with no properties", () => {
    expect(makeWeaponMock().isFirearm).toBe(false);
    expect(makeWeaponMock({ properties: undefined as any }).isFirearm).toBe(false);
  });

  it.each(["ammunition", "staff", "consumable", null])("is false for parsing type %s", (parsingType) => {
    expect(makeWeaponMock({ properties: FIREARM, parsingType }).isFirearm).toBe(false);
  });
});

// =============================================================================
// hasOverkillRangedDamage - Overkill's other half, an extra 1d8 for a Ranged
// weapon that already adds the ability modifier
// =============================================================================
describe("DDBItem.prototype.hasOverkillRangedDamage", () => {
  // DDB attackType: 1 melee, 2 ranged
  function makeWeaponMock({
    properties = [] as { name: string }[],
    classFeatures = ["overkill"] as string[],
    attackType = 2 as number | null,
    parsingType = "weapon" as string | null,
  } = {}) {
    const mock = Object.create(DDBItem.prototype);
    mock.ddbDefinition = { properties, attackType };
    mock.flags = { classFeatures };
    mock.parsingType = parsingType;
    return mock;
  }

  const FIREARM = [{ name: "Firearm" }, { name: "Ammunition" }, { name: "Reload" }];

  // Longbow, Shortbow, Sling and the Dart, which DDB types as ranged despite
  // being thrown, because it is a Simple Ranged Weapon
  it("applies to a ranged weapon", () => {
    expect(makeWeaponMock().hasOverkillRangedDamage).toBe(true);
  });

  it("does not apply without the feature", () => {
    expect(makeWeaponMock({ classFeatures: [] }).hasOverkillRangedDamage).toBe(false);
    expect(makeWeaponMock({ classFeatures: ["pactWeapon"] }).hasOverkillRangedDamage).toBe(false);
  });

  // Dagger, Handaxe, Javelin: melee weapons that can be thrown, not Ranged weapons
  it("does not apply to a melee or thrown melee weapon", () => {
    expect(makeWeaponMock({ attackType: 1 }).hasOverkillRangedDamage).toBe(false);
    expect(makeWeaponMock({ attackType: null }).hasOverkillRangedDamage).toBe(false);
  });

  // firearms take the ability modifier instead, never both
  it("does not apply to a firearm", () => {
    expect(makeWeaponMock({ properties: FIREARM }).hasOverkillRangedDamage).toBe(false);
  });

  it.each(["ammunition", "staff", "consumable", null])("is false for parsing type %s", (parsingType) => {
    expect(makeWeaponMock({ parsingType }).hasOverkillRangedDamage).toBe(false);
  });
});

// =============================================================================
// hasOverkill - the Gunslinger level 11 feature, the Firearm property's
// "unless otherwise stated"
// =============================================================================
describe("DDBItem.hasOverkill", () => {
  const overkill = { definition: { name: "Overkill", requiredLevel: 11 } };
  const trickShot = { definition: { name: "Trick Shot", requiredLevel: 3 } };

  function makeClass({ name = "Gunslinger", level = 11, classFeatures = [overkill] } = {}) {
    return { definition: { name }, level, classFeatures } as any;
  }

  it("detects the feature on a Gunslinger at the required level", () => {
    expect(DDBItem.hasOverkill([makeClass()])).toBe(true);
    expect(DDBItem.hasOverkill([makeClass({ level: 20 })])).toBe(true);
  });

  // DDB lists every class feature regardless of the character's level
  it("does not detect it below the required level", () => {
    expect(DDBItem.hasOverkill([makeClass({ level: 10 })])).toBe(false);
    expect(DDBItem.hasOverkill([makeClass({ level: 1 })])).toBe(false);
  });

  it("ignores an Overkill feature on another class", () => {
    expect(DDBItem.hasOverkill([makeClass({ name: "Blood Hunter", level: 20 })])).toBe(false);
  });

  it("finds it on a multiclassed Gunslinger", () => {
    const classes = [makeClass({ name: "Fighter", level: 3, classFeatures: [] }), makeClass({ level: 12 })];
    expect(DDBItem.hasOverkill(classes)).toBe(true);
  });

  it("is false without the feature", () => {
    expect(DDBItem.hasOverkill([makeClass({ classFeatures: [trickShot] })])).toBe(false);
  });

  // the muncher builds a mock character with no classes
  it("is false for an empty or missing class list", () => {
    expect(DDBItem.hasOverkill([])).toBe(false);
    expect(DDBItem.hasOverkill(null)).toBe(false);
    expect(DDBItem.hasOverkill(undefined)).toBe(false);
  });
});

// =============================================================================
// getCriticalShotThreshold - the Gunslinger level 2 feature, whose levelScale
// DDB resolves to the threshold for the character's level
// =============================================================================
describe("DDBItem.getCriticalShotThreshold", () => {
  function criticalShot(fixedValue: number | null) {
    return {
      definition: { name: "Critical Shot", requiredLevel: 2 },
      levelScale: fixedValue === null ? null : { level: 2, fixedValue },
    };
  }

  function makeClass({
    name = "Gunslinger",
    level = 2,
    classFeatures = [criticalShot(19)] as any[],
  } = {}) {
    return { definition: { name }, level, classFeatures } as any;
  }

  // 19 at level 2, 18 at 9, 17 at 17, as DDB ships them
  it.each([[2, 19], [9, 18], [17, 17], [20, 17]])("returns the level %i threshold %i", (level, fixed) => {
    expect(DDBItem.getCriticalShotThreshold([makeClass({ level, classFeatures: [criticalShot(fixed)] })]))
      .toBe(fixed);
  });

  it("returns null below the required level", () => {
    expect(DDBItem.getCriticalShotThreshold([makeClass({ level: 1 })])).toBeNull();
  });

  it("ignores a Critical Shot feature on another class", () => {
    expect(DDBItem.getCriticalShotThreshold([makeClass({ name: "Fighter", level: 20 })])).toBeNull();
  });

  it("finds it on a multiclassed Gunslinger", () => {
    const classes = [makeClass({ name: "Fighter", level: 3, classFeatures: [] }), makeClass({ level: 9 })];
    expect(DDBItem.getCriticalShotThreshold(classes)).toBe(19);
  });

  it("returns null without the feature or a scale value", () => {
    expect(DDBItem.getCriticalShotThreshold([makeClass({ classFeatures: [] })])).toBeNull();
    expect(DDBItem.getCriticalShotThreshold([makeClass({ classFeatures: [criticalShot(null)] })])).toBeNull();
  });

  // the muncher builds a mock character with no classes
  it("returns null for an empty or missing class list", () => {
    expect(DDBItem.getCriticalShotThreshold([])).toBeNull();
    expect(DDBItem.getCriticalShotThreshold(null)).toBeNull();
    expect(DDBItem.getCriticalShotThreshold(undefined)).toBeNull();
  });
});

// =============================================================================
// rangedCriticalThreshold - Critical Shot applied to a weapon, unless ac5e is
// installed and its own effect is doing the job
// =============================================================================
describe("DDBItem.prototype.rangedCriticalThreshold", () => {
  const criticalShot = {
    definition: { name: "Critical Shot", requiredLevel: 2 },
    levelScale: { level: 9, fixedValue: 18 },
  };

  function makeWeaponMock({
    attackType = 2 as number | null,
    parsingType = "weapon" as string | null,
    classes = [{ definition: { name: "Gunslinger" }, level: 9, classFeatures: [criticalShot] }] as any[],
  } = {}) {
    const mock = Object.create(DDBItem.prototype);
    mock.ddbDefinition = { attackType };
    mock.parsingType = parsingType;
    mock.ddbData = { character: { classes } };
    return mock;
  }

  // SystemHelpers.effectModules() early-returns this cache, so setting it is
  // the only way to fake an install without stubbing game.modules
  function setAc5eInstalled(installed: boolean) {
    foundry.utils.setProperty(
      CONFIG,
      "DDBI.EFFECT_CONFIG.MODULES.installedModules",
      installed ? { ac5eInstalled: true } : null,
    );
  }

  afterEach(() => {
    setAc5eInstalled(false);
  });

  it("applies to a ranged weapon", () => {
    expect(makeWeaponMock().rangedCriticalThreshold).toBe(18);
  });

  // unlike Overkill's 1d8, firearms are Ranged weapons and do crit-expand
  it("applies to a firearm", () => {
    const mock = makeWeaponMock();
    mock.ddbDefinition.properties = [{ name: "Firearm" }];
    expect(mock.rangedCriticalThreshold).toBe(18);
  });

  // Dagger, Handaxe, Javelin
  it("does not apply to a melee or thrown melee weapon", () => {
    expect(makeWeaponMock({ attackType: 1 }).rangedCriticalThreshold).toBeNull();
    expect(makeWeaponMock({ attackType: null }).rangedCriticalThreshold).toBeNull();
  });

  it("does not apply without the feature", () => {
    expect(makeWeaponMock({ classes: [] }).rangedCriticalThreshold).toBeNull();
  });

  // the enricher's ac5eOnly effect owns this when the module is present
  it("stands down when ac5e is installed", () => {
    setAc5eInstalled(true);
    expect(makeWeaponMock().rangedCriticalThreshold).toBeNull();
  });

  it.each(["ammunition", "staff", "consumable", null])("is null for parsing type %s", (parsingType) => {
    expect(makeWeaponMock({ parsingType }).rangedCriticalThreshold).toBeNull();
  });
});

// =============================================================================
// parsePerSpellMagicItem - per-spell charge detection
// =============================================================================
describe("DDBItem.prototype.parsePerSpellMagicItem", () => {
  function makeItemMock(description: string) {
    const mock = Object.create(DDBItem.prototype);
    mock.ddbDefinition = { description };
    return mock;
  }

  it("detects 'each once per' as per-spell with 1 charge", () => {
    const mock = makeItemMock("");
    const result = mock.parsePerSpellMagicItem("each once per day");
    expect(result.isPerSpell).toBe(true);
    expect(result.charges).toBe(1);
  });

  it("detects 'each twice per' as per-spell with 2 charges", () => {
    const mock = makeItemMock("");
    const result = mock.parsePerSpellMagicItem("each twice per day");
    expect(result.isPerSpell).toBe(true);
    expect(result.charges).toBe(2);
  });

  it.each([
    "This property can't be used this way again until the next dawn.",
    "Once this property is used, it can't be used again until the next dusk.",
    "Once this property is used, it can’t be used again until the next dawn.",
  ])("falls back to per-spell wording in the item description: %s", (description) => {
    const mock = makeItemMock(description);
    const result = mock.parsePerSpellMagicItem("");
    expect(result.isPerSpell).toBe(true);
    expect(result.charges).toBe(1);
  });

  it("returns not per-spell when no pattern matches", () => {
    const mock = makeItemMock("A wand that shoots fire.");
    const result = mock.parsePerSpellMagicItem("");
    expect(result.isPerSpell).toBe(false);
    expect(result.charges).toBeNull();
  });

  it.each([
    "This property can’t be used to cast that spell again until the next dawn.",
    "Once this property is used, it can't be used again until the next dusk.",
    "Once this property is used, it can’t be used again until the next dawn.",
  ])("detects per-spell wording in useDescription: %s", (useDescription) => {
    const mock = makeItemMock("");
    const result = mock.parsePerSpellMagicItem(useDescription);
    expect(result.isPerSpell).toBe(true);
    expect(result.charges).toBe(1);
  });
});

// =============================================================================
// parseSaveFromDescription - save.ability may only ever hold 5e ability keys.
// The wildcard capture this replaced produced "dc " from "DC 15 Dexterity", and
// its lazy match paired DCs with abilities from unrelated sentences.
// =============================================================================
describe("DDBItem.parseSaveFromDescription", () => {
  it.each([
    // the common phrasing, which used to yield ["dc ", "dex"]
    ["must succeed on a DC 15 Dexterity saving throw or take 5d4 force damage", ["dex"], "15", ""],
    ["must make a DC 15 Dexterity saving throw", ["dex"], "15", ""],
    ["must succeed on an Intelligence saving throw against your spell save DC", ["int"], "", "spellcasting"],
    // save.ability is a choice list, so both halves of an either/or belong in it
    ["must make a DC 16 Strength or Dexterity saving throw", ["str", "dex"], "16", ""],
    // DDB text is not reliably capitalised
    ["must succeed on a DC 12 wisdom saving throw", ["wis"], "12", ""],
    // DDB writes the roll both ways; Muscle Graft uses the "save" shorthand
    ["you must succeed on a DC 15 Constitution save", ["con"], "15", ""],
    ["each creature makes a DC 10 Charisma save", ["cha"], "10", ""],
  ])("reads %s", (description, ability, formula, calculation) => {
    expect(DDBItem.parseSaveFromDescription(description)).toEqual({
      ability,
      dc: { formula, calculation },
    });
  });

  it.each([
    // an ability check, which the lazy wildcard used to reach past into a later save
    ["A DC 24 Dexterity (Acrobatics) check ends the effect. It must make a saving throw."],
    // "death" and "saving" are not abilities; these produced "dea" and "sav"
    ["must succeed on a death saving throw"],
    ["must make a DC 13 saving throw of your choice"],
    // a bare parenthesised DC names no ability at all
    ["you can cast one of the following spells (save DC 18)"],
    ["A perfectly ordinary hat."],
  ])("finds no save in %s", (description) => {
    expect(DDBItem.parseSaveFromDescription(description)).toBeNull();
  });

  it("never emits an ability outside the six", () => {
    const abilities = ["str", "dex", "con", "int", "wis", "cha"];
    for (const description of [
      "must succeed on a DC 15 Dexterity saving throw",
      "must make a DC 16 Strength or Dexterity saving throw",
      "must succeed on a Charisma saving throw against your spell save DC",
    ]) {
      const save = DDBItem.parseSaveFromDescription(description);
      expect(save?.ability?.every((ability) => abilities.includes(ability))).toBe(true);
    }
  });

  it("pairs the ability with the DC from its own sentence when an item has two saves", () => {
    // Banjo of Ol' Jericho Sticks: a Wisdom save with a formula DC, and a
    // separate DC 19 Charisma save on another property
    const save = DDBItem.parseSaveFromDescription(
      "The target must succeed on a Wisdom saving throw (DC = 16 + the banjo's bonus) or have the Charmed condition."
      + " Birdcage. You can force a creature you have Charmed to make a DC 19 Charisma saving throw.",
    );
    expect(save).toEqual({ ability: ["cha"], dc: { formula: "19", calculation: "" } });
  });
});
