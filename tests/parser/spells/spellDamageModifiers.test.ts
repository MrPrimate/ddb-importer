/**
 * dnd5e 6 has no active effect change type that can alter a die result, so Elemental Adept's
 * "treat a 1 as a 2" is baked onto the damage parts of the character's spells at parse time
 * (DamageData.modifiers: "8d6" -> "8d6min2"). These pin which parts are eligible.
 */
import SpellDataUtils from "../../../src/parser/spells/SpellDataUtils";
import DDBDataUtils from "../../../src/parser/lib/DDBDataUtils";

function damagePart(overrides: any = {}): any {
  return {
    number: 8,
    denomination: 6,
    bonus: "",
    types: ["fire"],
    custom: { enabled: false, formula: "" },
    scaling: { mode: "whole", number: 1, formula: "" },
    ...overrides,
  };
}

function spellWithParts(parts: any[], type = "save"): any {
  return { name: "Test Spell", system: { activities: { abc: { type, damage: { parts } } } } };
}

describe("SpellDataUtils.applyDamageDieModifiers", () => {
  it("adds the modifier to parts of the chosen type only", () => {
    const spell = spellWithParts([damagePart(), damagePart({ types: ["cold"] })]);
    expect(SpellDataUtils.applyDamageDieModifiers(spell, ["min2"], ["fire"])).toBe(true);
    expect(spell.system.activities.abc.damage.parts[0].modifiers).toEqual(["min2"]);
    expect(spell.system.activities.abc.damage.parts[1].modifiers).toBeUndefined();
  });

  it("skips a part that offers a type outside the chosen ones", () => {
    const spell = spellWithParts([damagePart({ types: ["acid", "cold", "fire"] })]);
    expect(SpellDataUtils.applyDamageDieModifiers(spell, ["min2"], ["fire"])).toBe(false);
  });

  it("stamps a multi-type part when every type was chosen", () => {
    const spell = spellWithParts([damagePart({ types: ["cold", "fire"] })]);
    expect(SpellDataUtils.applyDamageDieModifiers(spell, ["min2"], ["fire", "cold"])).toBe(true);
  });

  it("skips untyped and flat parts", () => {
    const spell = spellWithParts([
      damagePart({ types: [] }),
      damagePart({ number: null, denomination: null, bonus: "5" }),
    ]);
    expect(SpellDataUtils.applyDamageDieModifiers(spell, ["min2"], ["fire"])).toBe(false);
  });

  it("is idempotent and removable", () => {
    const spell = spellWithParts([damagePart({ modifiers: ["r1"] })]);
    expect(SpellDataUtils.applyDamageDieModifiers(spell, ["min2"], ["fire"])).toBe(true);
    expect(SpellDataUtils.applyDamageDieModifiers(spell, ["min2"], ["fire"])).toBe(false);
    expect(spell.system.activities.abc.damage.parts[0].modifiers).toEqual(["r1", "min2"]);
    expect(SpellDataUtils.applyDamageDieModifiers(spell, ["min2"], ["fire"], { remove: true })).toBe(true);
    expect(spell.system.activities.abc.damage.parts[0].modifiers).toEqual(["r1"]);
  });
});

describe("DDBDataUtils.getElementalAdeptTypes", () => {
  function ddb(feats: any[], featOptions: any[] = []): any {
    return { character: { feats, options: { race: [], class: [], feat: featOptions } } };
  }

  it("is empty without the feat, even when a matching option name exists", () => {
    expect(DDBDataUtils.getElementalAdeptTypes(ddb([], [{ componentId: 1, definition: { name: "Fire" } }]))).toEqual([]);
  });

  it("reads each pick of the repeatable feat from its feat option", () => {
    const feats = [
      { definition: { id: 10, name: "Elemental Adept" } },
      { definition: { id: 11, name: "Elemental Adept" } },
    ];
    const options = [
      { componentId: 10, definition: { name: "Fire" } },
      { componentId: 11, definition: { name: "Cold" } },
      { componentId: 99, definition: { name: "Acid" } },
    ];
    expect(DDBDataUtils.getElementalAdeptTypes(ddb(feats, options)).sort()).toEqual(["cold", "fire"]);
  });

  it("reads a type carried in the feat name", () => {
    expect(DDBDataUtils.getElementalAdeptTypes(ddb([{ definition: { id: 3, name: "Elemental Adept (Lightning)" } }])))
      .toEqual(["lightning"]);
  });
});
