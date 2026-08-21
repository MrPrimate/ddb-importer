/**
 * AC effect change-emission tests.
 *
 * Unlike ac.test.ts (which mocks ACBonusEffects to test the calculation
 * branches), this file exercises the REAL effect builders and pins the exact
 * change keys/types/values they emit. These are the characterization pins for
 * the dnd5e 6.0 AC rework: `ac.calc`/`ac.formula` overrides become
 * `ac.calcs`/`ac.formulas` add changes there, and these assertions are the
 * before-picture.
 */

import DDBCharacter from "../../../src/parser/DDBCharacter";
import "../../../src/parser/character/ac";
import ACBonusEffects from "../../../src/parser/enrichers/effects/ACBonusEffects";
import ChangeHelper from "../../../src/parser/enrichers/effects/ChangeHelper";
import { makeMockCharacter } from "../../_fixtures/mockCharacter";

// =============================================================================
// dnd5e 6.0 AC change helpers (WP1 of the AC rework)
// =============================================================================
describe("ChangeHelper 6.0 AC helpers", () => {
  it("acCalcsAddChange adds a calc key to ac.calcs", () => {
    expect(ChangeHelper.acCalcsAddChange("mage", 5)).toEqual({
      key: "system.attributes.ac.calcs",
      value: "mage",
      type: "add",
      priority: 5,
    });
  });

  it("acFormulaAddChange adds a formula string to ac.formulas", () => {
    expect(ChangeHelper.acFormulaAddChange("13 + @abilities.dex.mod")).toEqual({
      key: "system.attributes.ac.formulas",
      value: "13 + @abilities.dex.mod",
      type: "add",
      priority: 20,
    });
  });

  it("acOverrideChange overrides ac.override", () => {
    expect(ChangeHelper.acOverrideChange(19, 50)).toEqual({
      key: "system.attributes.ac.override",
      value: "19",
      type: "override",
      priority: 50,
    });
  });
});

describe("ACBonusEffects.generateACFormulaEffect", () => {
  it("emits a single formulas add change with the effect marked as an AC armor effect", () => {
    const effect = ACBonusEffects.generateACFormulaEffect("10 + @abilities.dex.mod + @abilities.con.mod", "Unarmored Defense", true);

    expect(effect.system!.changes!).toEqual([{
      key: "system.attributes.ac.formulas",
      value: "10 + @abilities.dex.mod + @abilities.con.mod",
      type: "add",
      priority: 20,
    }]);
    expect(effect.disabled).toBe(false);
    expect(effect.transfer).toBe(true);
    expect(effect.origin).toBe("AC");
    expect(effect.flags!.dae).toEqual({ transfer: true, armorEffect: true });
    expect(effect.flags!.ddbimporter!.disabled).toBe(false);
  });

  it("flags ddbimporter.disabled when not alwaysActive", () => {
    const effect = ACBonusEffects.generateACFormulaEffect("13 + @abilities.dex.mod", "Mage Armor");

    expect(effect.flags!.ddbimporter!.disabled).toBe(true);
    expect(effect.disabled).toBe(false);
  });
});

// =============================================================================
// ACBonusEffects.generateFixedACEffect
// =============================================================================
describe("ACBonusEffects.generateFixedACEffect", () => {
  it("emits a custom calc override and a formula override at the given priority", () => {
    const effect = ACBonusEffects.generateFixedACEffect("13 + @abilities.dex.mod", "AC Test", false, 22);

    expect(effect.system!.changes!).toEqual([
      { key: "system.attributes.ac.calc", value: "custom", type: "override", priority: 22 },
      { key: "system.attributes.ac.formula", value: "13 + @abilities.dex.mod", type: "override", priority: 22 },
    ]);
  });

  it("defaults to override type at priority 30", () => {
    const effect = ACBonusEffects.generateFixedACEffect("15", "AC Flat");

    expect(effect.system!.changes!).toHaveLength(2);
    for (const change of effect.system!.changes!) {
      expect(change.type).toBe("override");
      expect(change.priority).toBe(30);
    }
  });

  it("marks the effect as an always-on AC armor effect", () => {
    const effect = ACBonusEffects.generateFixedACEffect("15", "AC Flat", true);

    expect(effect.disabled).toBe(false);
    expect(effect.transfer).toBe(true);
    expect(effect.origin).toBe("AC");
    expect(effect.flags!.dae).toEqual({ transfer: true, armorEffect: true });
    expect(effect.flags!.ddbimporter!.disabled).toBe(false);
    expect(effect.flags!.ddbimporter!.characterEffect).toBe(true);
  });

  it("flags ddbimporter.disabled when not alwaysActive", () => {
    const effect = ACBonusEffects.generateFixedACEffect("15", "AC Flat", false);

    expect(effect.flags!.ddbimporter!.disabled).toBe(true);
    // the effect itself is still enabled; only the importer flag records it
    expect(effect.disabled).toBe(false);
  });
});

// =============================================================================
// ACBonusEffects.generateBonusACEffect
// =============================================================================
describe("ACBonusEffects.generateBonusACEffect", () => {
  const ringOfProtectionModifier = {
    type: "bonus",
    subType: "armor-class",
    value: 1,
    isGranted: true,
    restriction: "",
  } as any;

  it("emits an add change on ac.bonus from a bonus modifier", () => {
    const effect = ACBonusEffects.generateBonusACEffect(
      [ringOfProtectionModifier], "AC: Ring of Protection", "armor-class", null as any,
    );

    expect(effect.system!.changes!).toHaveLength(1);
    const change = effect.system!.changes![0];
    expect(change.key).toBe("system.attributes.ac.bonus");
    expect(change.type).toBe("add");
    expect(change.priority).toBe(18);
    // unsignedAddChange strips the leading "+ "
    expect(change.value).toBe("1");
  });

  it("emits no changes when no matching modifiers", () => {
    const effect = ACBonusEffects.generateBonusACEffect([], "AC: Nothing", "armor-class", null as any);

    expect(effect.system!.changes!).toEqual([]);
  });
});

// =============================================================================
// _generateArmorClass integration - real effect emission
// =============================================================================
describe("DDBCharacter._generateArmorClass (real effect emission)", () => {
  const generateAC = DDBCharacter.prototype._generateArmorClass;

  function makeACMock(ddbOverrides: any = {}) {
    const mock = makeMockCharacter({
      ddbCharacter: {
        inventory: [],
        feats: [],
        classes: [],
        characterValues: [],
        ...ddbOverrides,
      },
    });
    mock.armor = {};
    mock.isArmored = DDBCharacter.prototype.isArmored;
    mock.isUnArmored = DDBCharacter.prototype.isUnArmored;
    mock._generateOverrideArmorClass = DDBCharacter.prototype._generateOverrideArmorClass;
    return mock;
  }

  // NOTE: {type: "bonus", subType: "armor-class"} sits in EXCLUDED.acBonus, so
  // getModifiers strips it from every source the misc-bonus loop reads - those
  // bonuses become effects on their source item via EffectGenerator instead.
  // The actor-level misc path is effectively unreachable for them; pin that so
  // the 6.0 rework does not accidentally double-emit.
  it("race armor-class bonus modifier does NOT attach an actor-level bonus effect (excluded as an item effect)", () => {
    const mock = makeACMock({
      modifiers: {
        class: [], background: [], item: [], feat: [], condition: [],
        race: [{
          type: "bonus", subType: "armor-class", value: 1, isGranted: true,
          restriction: "", componentId: 999, friendlySubtypeName: "Armor Class",
        }],
      },
    });
    generateAC.call(mock);

    const acBonusEffects = mock.raw.character.effects.filter((e: any) =>
      (e.system?.changes ?? []).some((c: any) => c.key === "system.attributes.ac.bonus"),
    );
    expect(acBonusEffects).toEqual([]);
  });

  it("custom characterValues AC bonus (typeId 3) attaches an ac.bonus add change", () => {
    const mock = makeACMock({
      characterValues: [{ typeId: 3, value: 2, notes: "Magic Trinket" }],
    });
    generateAC.call(mock);

    const bonusEffects = mock.raw.character.effects.filter((e: any) =>
      (e.system?.changes ?? []).some((c: any) => c.key === "system.attributes.ac.bonus"),
    );
    expect(bonusEffects).toHaveLength(1);
    expect(bonusEffects[0].name).toBe("Magic Trinket");
    const change = bonusEffects[0].system.changes[0];
    expect(change.type).toBe("add");
    expect(change.value).toBe("+ 2");
    expect(change.priority).toBe(30);
  });

  it("per-armor fixed AC effects land only in flags.ddbimporter.acEffects, never on the actor", () => {
    const mock = makeACMock();
    generateAC.call(mock);

    // the base Unarmored option generates one fixed effect
    const acEffects = mock.raw.character.flags.ddbimporter.acEffects;
    expect(acEffects.length).toBeGreaterThanOrEqual(1);
    const changes = acEffects[0].system.changes;
    expect(changes.map((c: any) => c.key)).toEqual([
      "system.attributes.ac.calc",
      "system.attributes.ac.formula",
    ]);
    expect(changes[0].value).toBe("custom");

    // and none of them are attached to the actor's effects
    const attachedFixed = mock.raw.character.effects.filter((e: any) =>
      (e.system?.changes ?? []).some((c: any) => c.key === "system.attributes.ac.calc"),
    );
    expect(attachedFixed).toEqual([]);
  });

  it("override path attaches exactly one fixed effect with flat custom calc", () => {
    const mock = makeACMock({
      characterValues: [{ typeId: 1, value: 21 }],
    });
    generateAC.call(mock);

    expect(mock.raw.character.effects).toHaveLength(1);
    const changes = mock.raw.character.effects[0].system.changes;
    expect(changes).toEqual([
      { key: "system.attributes.ac.calc", value: "custom", type: "override", priority: 30 },
      { key: "system.attributes.ac.formula", value: "21", type: "override", priority: 30 },
    ]);
  });
});
