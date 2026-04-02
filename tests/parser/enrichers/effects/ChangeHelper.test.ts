// Mock barrel re-exports to break circular dependency chains:
// ChangeHelper → AutoEffects → lib/_module → DDBItemImporter → effects/_module → DDBEffectHelper → ChangeHelper (not ready)
// MidiOverTimeEffect → DDBEffectHelper (direct import, same circular issue)
// config/_module → settings → lib/_module → DDBSources → config/_module (DICTIONARY not ready)
// Import the real DICTIONARY (no circular deps) but stub SETTINGS (which triggers the circular chain)
vi.mock("../../../../src/config/_module", async () => {
  const dict = await vi.importActual<any>("../../../../src/config/dictionary/dictionary");
  return {
    SETTINGS: { MODULE_ID: "ddb-importer" },
    DICTIONARY: dict.default,
  };
});
vi.mock("../../../../src/effects/_module", () => ({}));
vi.mock("../../../../src/effects/DDBEffectHelper", () => ({ default: {} }));

import ChangeHelper from "../../../../src/parser/enrichers/effects/ChangeHelper";

describe("ChangeHelper.change", () => {
  it("returns a change object with the given params", () => {
    const result = ChangeHelper.change({ value: "5", priority: 20, key: "system.bonuses.mwak.attack", type: "add" });
    expect(result).toEqual({
      key: "system.bonuses.mwak.attack",
      value: "5",
      type: "add",
      priority: 20,
    });
  });
});

describe("ChangeHelper.signedAddChange", () => {
  it("prepends + to positive integers", () => {
    const result = ChangeHelper.signedAddChange(5, 20, "system.bonuses.mwak.attack");
    expect(result.value).toBe("+5");
    expect(result.type).toBe("add");
  });

  it("does not double-sign negative integers", () => {
    const result = ChangeHelper.signedAddChange(-3, 20, "system.bonuses.mwak.attack");
    expect(result.value).toBe(-3);
  });

  it("does not double-sign strings starting with +", () => {
    const result = ChangeHelper.signedAddChange("+2", 20, "system.bonuses.mwak.attack");
    expect(result.value).toBe("+2");
  });

  it("does not double-sign strings starting with -", () => {
    const result = ChangeHelper.signedAddChange("-1", 20, "system.bonuses.mwak.attack");
    expect(result.value).toBe("-1");
  });

  it("prepends + to unsigned string values", () => {
    const result = ChangeHelper.signedAddChange("1d6", 20, "system.bonuses.mwak.damage");
    expect(result.value).toBe("+1d6");
  });

  it("prepends + to zero", () => {
    const result = ChangeHelper.signedAddChange(0, 20, "system.bonuses.mwak.attack");
    // 0 is an integer but not >= 0... wait, 0 >= 0 is true
    expect(result.value).toBe("+0");
  });
});

describe("ChangeHelper.unsignedAddChange", () => {
  it("preserves + without trailing whitespace", () => {
    // regex /^\+\s+/ only strips + followed by whitespace
    const result = ChangeHelper.unsignedAddChange("+5", 20, "system.bonuses.mwak.attack");
    expect(result.value).toBe("+5");
  });

  it("strips + followed by whitespace", () => {
    const result = ChangeHelper.unsignedAddChange("+  5", 20, "system.bonuses.mwak.attack");
    expect(result.value).toBe("5");
  });

  it("cleans '+ +' artifacts", () => {
    const result = ChangeHelper.unsignedAddChange("+ +3", 20, "system.bonuses.mwak.attack");
    expect(result.value).toBe("+3");
  });

  it("trims whitespace", () => {
    const result = ChangeHelper.unsignedAddChange("  5  ", 20, "system.bonuses.mwak.attack");
    expect(result.value).toBe("5");
  });

  it("preserves negative values", () => {
    const result = ChangeHelper.unsignedAddChange("-3", 20, "system.bonuses.mwak.attack");
    expect(result.value).toBe("-3");
  });
});

describe("ChangeHelper.addChange", () => {
  it("is an alias for unsignedAddChange", () => {
    const unsigned = ChangeHelper.unsignedAddChange("5", 20, "key");
    const add = ChangeHelper.addChange("5", 20, "key");
    expect(add).toEqual(unsigned);
  });
});

describe("ChangeHelper.customChange", () => {
  it("returns type custom", () => {
    const result = ChangeHelper.customChange("value", 10, "key");
    expect(result.type).toBe("custom");
    expect(result.value).toBe("value");
    expect(result.priority).toBe(10);
  });
});

describe("ChangeHelper.customBonusChange", () => {
  it("prepends + to positive integers", () => {
    const result = ChangeHelper.customBonusChange(3, 20, "key");
    expect(result.value).toBe("+3");
    expect(result.type).toBe("custom");
  });

  it("does not modify already-signed strings", () => {
    const result = ChangeHelper.customBonusChange("-2", 20, "key");
    expect(result.value).toBe("-2");
  });

  it("prepends + to unsigned formula strings", () => {
    const result = ChangeHelper.customBonusChange("1d8", 20, "key");
    expect(result.value).toBe("+1d8");
  });
});

describe("ChangeHelper.upgradeChange", () => {
  it("returns type upgrade", () => {
    const result = ChangeHelper.upgradeChange("60", 30, "system.attributes.senses.darkvision");
    expect(result).toEqual({
      key: "system.attributes.senses.darkvision",
      value: "60",
      type: "upgrade",
      priority: 30,
    });
  });
});

describe("ChangeHelper.overrideChange", () => {
  it("returns type override", () => {
    const result = ChangeHelper.overrideChange("true", 50, "system.traits.ci.value");
    expect(result.type).toBe("override");
  });
});

describe("ChangeHelper.multiplyChange", () => {
  it("returns type multiply", () => {
    const result = ChangeHelper.multiplyChange("2", 20, "system.attributes.movement.walk");
    expect(result.type).toBe("multiply");
    expect(result.value).toBe("2");
  });
});

describe("ChangeHelper.downgradeChange", () => {
  it("returns type downgrade", () => {
    const result = ChangeHelper.downgradeChange("0", 20, "system.attributes.movement.walk");
    expect(result.type).toBe("downgrade");
  });
});

describe("ChangeHelper.tokenMagicFXChange", () => {
  it("returns a tokenMagic custom change", () => {
    const result = ChangeHelper.tokenMagicFXChange("glow");
    expect(result.key).toBe("macro.tokenMagic");
    expect(result.type).toBe("custom");
    expect(result.value).toBe("glow");
    expect(result.priority).toBe(20);
  });

  it("accepts custom priority", () => {
    const result = ChangeHelper.tokenMagicFXChange("fire", 50);
    expect(result.priority).toBe(50);
  });
});

describe("ChangeHelper.damageResistanceChange", () => {
  it("lowercases the damage type", () => {
    const result = ChangeHelper.damageResistanceChange("Fire");
    expect(result.value).toBe("fire");
    expect(result.key).toBe("system.traits.dr.value");
    expect(result.type).toBe("add");
  });
});

describe("ChangeHelper.atlChange", () => {
  it("maps legacy ATL.dimLight to ATL.light.dim", () => {
    const result = ChangeHelper.atlChange("ATL.dimLight", "override", "30");
    expect(result.key).toBe("ATL.light.dim");
  });

  it("maps legacy ATL.brightLight to ATL.light.bright", () => {
    const result = ChangeHelper.atlChange("ATL.brightLight", "override", "15");
    expect(result.key).toBe("ATL.light.bright");
  });

  it("maps legacy ATL.lightAnimation to ATL.light.animation", () => {
    const result = ChangeHelper.atlChange("ATL.lightAnimation", "override", "{}");
    expect(result.key).toBe("ATL.light.animation");
  });

  it("maps legacy ATL.lightColor to ATL.light.color", () => {
    const result = ChangeHelper.atlChange("ATL.lightColor", "override", "#ff0000");
    expect(result.key).toBe("ATL.light.color");
  });

  it("maps legacy ATL.lightAlpha to ATL.light.alpha", () => {
    const result = ChangeHelper.atlChange("ATL.lightAlpha", "override", "0.5");
    expect(result.key).toBe("ATL.light.alpha");
  });

  it("maps legacy ATL.lightAngle to ATL.light.angle", () => {
    const result = ChangeHelper.atlChange("ATL.lightAngle", "override", "360");
    expect(result.key).toBe("ATL.light.angle");
  });

  it("passes through non-legacy keys unchanged", () => {
    const result = ChangeHelper.atlChange("ATL.light.dim", "upgrade", "60");
    expect(result.key).toBe("ATL.light.dim");
  });

  it("includes type, value, and priority", () => {
    const result = ChangeHelper.atlChange("ATL.dimLight", "override", "30", 25);
    expect(result.type).toBe("override");
    expect(result.value).toBe("30");
    expect(result.priority).toBe(25);
  });
});

describe("ChangeHelper.daeStatusEffectChange", () => {
  it("lowercases the status name", () => {
    const result = ChangeHelper.daeStatusEffectChange("Blinded");
    expect(result.key).toBe("macro.StatusEffect");
    expect(result.type).toBe("add");
    expect(result.value).toBe("blinded");
    expect(result.priority).toBe(20);
  });

  it("accepts custom priority", () => {
    const result = ChangeHelper.daeStatusEffectChange("Prone", 30);
    expect(result.priority).toBe(30);
  });
});
