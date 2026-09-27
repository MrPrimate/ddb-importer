// The feature factory initializes the real activity/enricher dependency chain first.
import "../../../src/parser/features/CharacterFeatureFactory";
import DDBSpellActivity from "../../../src/parser/activities/DDBSpellActivity";
import { installActivityConfigStubs } from "../../_fixtures/ddb/stubs";

beforeAll(() => {
  installActivityConfigStubs();
});

function atHigherLevels(dice: string | null): any {
  return {
    higherLevelDefinitions: dice
      ? [{ level: 1, typeId: 15, dice: { diceCount: 1, diceValue: 6, diceMultiplier: null, fixedValue: 0, diceString: dice }, value: null }]
      : [],
  };
}

/** Shaped on DDB's Marrow Transplant: only the healing modifier carries the upcast dice. */
const damageMod = {
  type: "damage",
  subType: "necrotic",
  restriction: "",
  die: { diceCount: 4, diceValue: 6, diceString: "4d6", fixedValue: null },
  atHigherLevels: atHigherLevels(null),
} as any;
const healMod = {
  type: "bonus",
  subType: "hit-points",
  restriction: "equal to the damage dealt",
  die: { diceCount: 4, diceValue: 6, diceString: "4d6", fixedValue: null },
  atHigherLevels: atHigherLevels("1d6"),
} as any;

function activityFor(modifiers: any[]): DDBSpellActivity {
  return Object.assign(Object.create(DDBSpellActivity.prototype), {
    ddbDefinition: { name: "Marrow Transplant", canCastAtHigherLevel: true, scaleType: "spellscale", modifiers },
  });
}

/**
 * A healing part scales from its own modifier. Walking every damage and healing modifier let the
 * last one decide, so the same spell imported differently when DDB reordered its modifiers.
 */
describe("DDBSpellActivity healing part scaling", () => {
  it.each([
    ["damage first", [damageMod, healMod]],
    ["healing first", [healMod, damageMod]],
  ])("scales the healing part by 1d6 with the %s", (_label, modifiers) => {
    const part = activityFor(modifiers).buildDamagePart({ damageString: "4d6", type: "healing", damageMod: healMod });
    expect(part.scaling).toMatchObject({ mode: "whole", number: 1, formula: "" });
  });

  it("leaves a part unscaled when its own modifier has no upcast dice", () => {
    const part = activityFor([healMod, damageMod]).buildDamagePart({ damageString: "4d6", type: "necrotic", damageMod });
    expect(part.scaling?.mode).toBe("");
  });
});
