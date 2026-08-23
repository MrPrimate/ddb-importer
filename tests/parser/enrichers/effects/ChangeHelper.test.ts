import ChangeHelper from "../../../../src/parser/enrichers/effects/ChangeHelper";
import { installActivityConfigStubs } from "../../../_fixtures/ddb/stubs";

// the roll mode helpers read CONFIG.Dice.D20Roll.ADV_MODE
beforeAll(() => {
  installActivityConfigStubs();
});

describe("ChangeHelper.change", () => {
  it("returns a change object with the given params", () => {
    const result = ChangeHelper.change({ value: "5", priority: 20, key: "system.bonuses.mwak.attack", type: "add" });
    expect(result).toEqual({
      key: "system.bonuses.mwak.attack",
      // phase is undefined (omitted) unless explicitly provided
      phase: undefined,
      value: "5",
      type: "add",
      priority: 20,
    });
  });

  it("passes through an explicit phase", () => {
    const result = ChangeHelper.change({ value: "5", priority: 20, key: "k", type: "add", phase: "final" });
    expect(result.phase).toBe("final");
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
    expect(result.value).toBe("-3");
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

describe("ChangeHelper.ac5eChange", () => {
  it("returns type ac5e and defaults phase to initial", () => {
    const result = ChangeHelper.ac5eChange("once; 1", 20, "flags.automated-conditions-5e.attack.disadvantage");
    expect(result).toEqual({
      key: "flags.automated-conditions-5e.attack.disadvantage",
      value: "once; 1",
      type: "ac5e",
      priority: 20,
      phase: "initial",
    });
  });

  it("honours an explicit final phase", () => {
    const result = ChangeHelper.ac5eChange("1", 50, "flags.automated-conditions-5e.attack.advantage", "final");
    expect(result.phase).toBe("final");
    expect(result.priority).toBe(50);
  });

  it("stringifies and trims the value", () => {
    expect(ChangeHelper.ac5eChange(18, 20, "flags.automated-conditions-5e.attack.criticalThreshold").value).toBe("18");
    expect(ChangeHelper.ac5eChange("  bonus=2  ", 20, "flags.automated-conditions-5e.damage.bonus").value).toBe("bonus=2");
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

describe("ChangeHelper.tokenChange", () => {
  it("translates legacy ATL.dimLight to the native token light key", () => {
    const result = ChangeHelper.tokenChange("ATL.dimLight", "override", "30");
    expect(result.key).toBe("token.light.dim");
  });

  it("translates the other legacy ATL light aliases", () => {
    expect(ChangeHelper.tokenChange("ATL.brightLight", "override", "15").key).toBe("token.light.bright");
    expect(ChangeHelper.tokenChange("ATL.lightAnimation", "override", "{}").key).toBe("token.light.animation");
    expect(ChangeHelper.tokenChange("ATL.lightColor", "override", "#ff0000").key).toBe("token.light.color");
    expect(ChangeHelper.tokenChange("ATL.lightAlpha", "override", "0.5").key).toBe("token.light.alpha");
    expect(ChangeHelper.tokenChange("ATL.lightAngle", "override", "360").key).toBe("token.light.angle");
  });

  it("translates a modern ATL key prefix to token", () => {
    const result = ChangeHelper.tokenChange("ATL.sight.range", "upgrade", "60");
    expect(result.key).toBe("token.sight.range");
  });

  it("passes native token keys through unchanged", () => {
    const result = ChangeHelper.tokenChange("token.light.dim", "upgrade", "60");
    expect(result.key).toBe("token.light.dim");
  });

  it("includes type, value, and priority", () => {
    const result = ChangeHelper.tokenChange("ATL.dimLight", "override", "30", 25);
    expect(result.type).toBe("override");
    expect(result.value).toBe("30");
    expect(result.priority).toBe(25);
  });
});

describe("ChangeHelper.daeStatusEffectChange", () => {
  it("lowercases the status name", () => {
    const result = ChangeHelper.daeStatusEffectChange("Blinded");
    expect(result.key).toBe("macro.StatusEffect");
    expect(result.type).toBe("custom");
    expect(result.value).toBe("blinded");
    expect(result.priority).toBe(20);
  });

  it("accepts custom priority", () => {
    const result = ChangeHelper.daeStatusEffectChange("Prone", 30);
    expect(result.priority).toBe(30);
  });
});

describe("ChangeHelper overtime saveDC", () => {
  const doc = { name: "Wretched" } as any;

  it("renders a numeric saveDC in the damage change", () => {
    const result = ChangeHelper.overTimeDamageChange({
      document: doc, turn: "start", damage: "1d6", damageType: "acid",
      saveAbility: "con", saveRemove: true, saveDamage: "nodamage", dc: 15,
    });
    expect(result.value).toContain("saveDC=15,");
    expect(result.value).not.toContain("[object Object]");
  });

  it("passes a rollData reference saveDC through the save change", () => {
    const result = ChangeHelper.overTimeSaveChange({
      document: doc, turn: "end", saveAbility: ["wis"], dc: "@attributes.spell.dc",
    });
    expect(result.value).toContain("saveDC=@attributes.spell.dc,");
    expect(result.value).not.toContain("[object Object]");
  });
});

describe("ChangeHelper trait change helpers", () => {
  it("damageVulnerabilityChange lowercases and targets dv", () => {
    const result = ChangeHelper.damageVulnerabilityChange("Cold");
    expect(result).toEqual({ key: "system.traits.dv.value", value: "cold", type: "add", priority: 20 });
  });

  it("damageImmunityChange lowercases and targets di", () => {
    const result = ChangeHelper.damageImmunityChange("Poison");
    expect(result).toEqual({ key: "system.traits.di.value", value: "poison", type: "add", priority: 20 });
  });

  it("conditionImmunityChange lowercases and targets ci", () => {
    const result = ChangeHelper.conditionImmunityChange("Paralyzed");
    expect(result).toEqual({ key: "system.traits.ci.value", value: "paralyzed", type: "add", priority: 20 });
  });

  it("honours a non-default priority", () => {
    expect(ChangeHelper.damageImmunityChange("healing", 30).priority).toBe(30);
  });
});

describe("ChangeHelper roll mode helpers", () => {
  it("exposes the dnd5e advantage modes", () => {
    expect(ChangeHelper.ADVANTAGE).toBe(1);
    expect(ChangeHelper.DISADVANTAGE).toBe(-1);
    expect(ChangeHelper.NORMAL).toBe(0);
  });

  it("builds an ability check advantage change", () => {
    expect(ChangeHelper.advantageAbilityCheckChange("str")).toEqual({
      key: "system.abilities.str.check.roll.mode",
      value: "1",
      type: "add",
      priority: 20,
    });
  });

  it("builds an ability save disadvantage change", () => {
    expect(ChangeHelper.disadvantageAbilitySaveChange("wis")).toEqual({
      key: "system.abilities.wis.save.roll.mode",
      value: "-1",
      type: "add",
      priority: 20,
    });
  });

  it("builds skill, initiative and death save changes", () => {
    expect(ChangeHelper.advantageSkillChange("prc").key).toBe("system.skills.prc.roll.mode");
    expect(ChangeHelper.disadvantageSkillChange("ste").value).toBe("-1");
    expect(ChangeHelper.disadvantageInitiativeChange().key).toBe("system.attributes.init.roll.mode");
    expect(ChangeHelper.advantageDeathSaveChange().key).toBe("system.attributes.death.roll.mode");
    expect(ChangeHelper.advantageDeathSaveChange().value).toBe("1");
  });

  it("honours a non-default priority", () => {
    expect(ChangeHelper.disadvantageAbilityCheckChange("int", 8).priority).toBe(8);
  });

  it("accepts a mode decided at runtime", () => {
    const mode = ChangeHelper.DISADVANTAGE;
    expect(ChangeHelper.abilityCheckRollModeChange("cha", mode)).toEqual({
      key: "system.abilities.cha.check.roll.mode",
      value: "-1",
      type: "add",
      priority: 20,
    });
    expect(ChangeHelper.rollModeChange("system.attributes.concentration.roll.mode", mode, 5)).toEqual({
      key: "system.attributes.concentration.roll.mode",
      value: "-1",
      type: "add",
      priority: 5,
    });
  });
});
