/**
 * dnd5e 6 has no active effect change type that can reroll dice, so the 2024 Healer feat's
 * "reroll a 1" is baked onto the die term of the character's healing spells at parse time
 * (DamageData.modifiers: "1d8" -> "1d8r1"). These pin which parts are eligible.
 */
import SpellDataUtils from "../../../src/parser/spells/SpellDataUtils";

function healPart(overrides: any = {}): any {
  return {
    number: 1,
    denomination: 8,
    bonus: "@mod",
    types: ["healing"],
    custom: { enabled: false, formula: "" },
    scaling: { mode: "whole", number: 1, formula: "" },
    ...overrides,
  };
}

function spellWithActivities(activities: Record<string, any>): any {
  return { name: "Test Spell", system: { activities } };
}

describe("SpellDataUtils.applyHealingDieModifiers", () => {
  it("adds the modifier to a heal activity's healing part", () => {
    const spell = spellWithActivities({ abc: { type: "heal", healing: healPart() } });
    expect(SpellDataUtils.applyHealingDieModifiers(spell)).toBe(true);
    expect(spell.system.activities.abc.healing.modifiers).toEqual(["r1"]);
  });

  it("adds the modifier to healing parts on non-heal activities", () => {
    const spell = spellWithActivities({
      abc: { type: "save", damage: { parts: [healPart({ types: ["fire"] }), healPart()] } },
    });
    expect(SpellDataUtils.applyHealingDieModifiers(spell)).toBe(true);
    expect(spell.system.activities.abc.damage.parts[0].modifiers).toBeUndefined();
    expect(spell.system.activities.abc.damage.parts[1].modifiers).toEqual(["r1"]);
  });

  it("leaves temporary hit point parts alone", () => {
    const spell = spellWithActivities({ abc: { type: "heal", healing: healPart({ types: ["temphp"] }) } });
    expect(SpellDataUtils.applyHealingDieModifiers(spell)).toBe(false);
    expect(spell.system.activities.abc.healing.modifiers).toBeUndefined();
  });

  it("leaves a flat healing bonus alone, as it rolls no die", () => {
    const spell = spellWithActivities({
      abc: { type: "heal", healing: healPart({ number: null, denomination: null, bonus: "1" }) },
    });
    expect(SpellDataUtils.applyHealingDieModifiers(spell)).toBe(false);
  });

  it("handles a custom formula that rolls dice, and skips one that does not", () => {
    const rolls = spellWithActivities({
      abc: {
        type: "heal",
        healing: healPart({ denomination: null, custom: { enabled: true, formula: "2d4 + @mod" } }),
      },
    });
    expect(SpellDataUtils.applyHealingDieModifiers(rolls)).toBe(true);
    expect(rolls.system.activities.abc.healing.modifiers).toEqual(["r1"]);

    const flat = spellWithActivities({
      abc: {
        type: "heal",
        healing: healPart({ denomination: null, custom: { enabled: true, formula: "@mod + 5" } }),
      },
    });
    expect(SpellDataUtils.applyHealingDieModifiers(flat)).toBe(false);
  });

  it("is idempotent", () => {
    const spell = spellWithActivities({ abc: { type: "heal", healing: healPart() } });
    SpellDataUtils.applyHealingDieModifiers(spell);
    expect(SpellDataUtils.applyHealingDieModifiers(spell)).toBe(false);
    expect(spell.system.activities.abc.healing.modifiers).toEqual(["r1"]);
  });

  it("removes only its own modifiers in remove mode", () => {
    const spell = spellWithActivities({ abc: { type: "heal", healing: healPart({ modifiers: ["min2"] }) } });
    SpellDataUtils.applyHealingDieModifiers(spell);
    expect(spell.system.activities.abc.healing.modifiers).toEqual(["min2", "r1"]);
    expect(SpellDataUtils.applyHealingDieModifiers(spell, ["r1"], { remove: true })).toBe(true);
    expect(spell.system.activities.abc.healing.modifiers).toEqual(["min2"]);
  });

  it("copes with a spell that has no activities", () => {
    expect(SpellDataUtils.applyHealingDieModifiers({ name: "Empty", system: {} } as any)).toBe(false);
  });
});
