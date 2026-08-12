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

  it("detects next dawn from can't-be-used formula", () => {
    expect(DDBItem.getMagicItemResetType("This property can't be used this way again until the next dawn.")).toBe("Dawn");
  });

  it("detects long rest", () => {
    expect(DDBItem.getMagicItemResetType("You can't use this feature again until you finish a long rest.")).toBe("LongRest");
  });

  it("detects short or long rest as 'sr'", () => {
    expect(DDBItem.getMagicItemResetType("You can't use it again until you finish a short or long rest.")).toBe("sr");
  });

  it("returns null when no reset pattern found", () => {
    expect(DDBItem.getMagicItemResetType("A simple magical trinket.")).toBeNull();
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

  it("falls back to description when useDescription is empty", () => {
    const mock = makeItemMock("This property can\u2019t be used this way again until the next dawn.");
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

  it("detects 'can't be used to cast that spell again' in useDescription", () => {
    const mock = makeItemMock("");
    const result = mock.parsePerSpellMagicItem("This property can\u2019t be used to cast that spell again until the next dawn.");
    expect(result.isPerSpell).toBe(true);
    expect(result.charges).toBe(1);
  });
});
