/**
 * Spell Mastery and Signature Spells read the wizard's picks from the class spell list flags DDB
 * sets (`baseLevelAtWill`, `isSignatureSpell`) or from the feature's "Choose a Spell" choices, and
 * turn each pick into a cast activity. No audit fixture has a pick made, so these are the only
 * pins for the populated path.
 */
import SpellMastery from "../../../src/parser/enrichers/class/wizard/SpellMastery";
import SignatureSpells from "../../../src/parser/enrichers/class/wizard/SignatureSpells";
import { makeEnricherData } from "../../_fixtures/ddb/factories";
import { installActivityConfigStubs } from "../../_fixtures/ddb/stubs";

beforeAll(() => {
  installActivityConfigStubs();
});

const FEATURE_ID = 413;
const CHOICE_TYPE_ID = 12168134;

function classSpell(name: string, level: number, flags: Record<string, any> = {}): any {
  return { componentId: 999, usesSpellSlot: true, prepared: true, alwaysPrepared: true, limitedUse: null, atWillLimitedUseLevel: null, definition: { name, level }, ...flags };
}

/** A "Choose a Spell" pick on the feature, resolving through choiceDefinitions like the real payload. */
function spellChoice(id: string, optionId: number): any {
  return { id, type: 4, subType: 4, componentId: FEATURE_ID, componentTypeId: CHOICE_TYPE_ID, optionValue: optionId, optionIds: [], parentChoiceId: null, label: "Choose a Spell" };
}

function build(Enricher: any, name: string, { spells = [] as any[], choices = [] as any[], options = [] as any[] } = {}): any {
  return makeEnricherData(Enricher, {
    name,
    klass: "Wizard",
    ddbParser: {
      originalName: name,
      ddbFeature: { id: FEATURE_ID, definition: { id: FEATURE_ID, name } },
    },
    character: {
      classes: [{ level: 20, definition: { name: "Wizard", classFeatures: [] }, classFeatures: [{ definition: { id: FEATURE_ID, name } }] }],
      spells: { class: spells },
      choices: {
        class: choices,
        race: [], feat: [], background: [], item: [],
        choiceDefinitions: [{ id: `${CHOICE_TYPE_ID}-4`, options }],
      },
    },
  });
}

describe("Wizard SpellMastery", () => {
  it("keeps the feature at its defaults when nothing is chosen", () => {
    const e = build(SpellMastery, "Spell Mastery", { spells: [classSpell("Fireball", 3)] });
    expect(e.type).toBeNull();
    expect(e.activity).toBeNull();
    expect(e.additionalActivities).toEqual([]);
    expect(e.noChoiceBuild).toBe(true);
  });

  it("casts each flagged spell at will at its own level, the first as the main activity", () => {
    const e = build(SpellMastery, "Spell Mastery", {
      spells: [
        classSpell("Fireball", 3),
        classSpell("Magic Missile", 1, { baseLevelAtWill: true }),
        classSpell("Misty Step", 2, { baseLevelAtWill: true }),
      ],
    });
    expect(e.type).toBe("cast");
    expect(e.activity).toEqual({
      name: "Magic Missile",
      addSpellUuid: "Magic Missile",
      noSpellslot: true,
      data: { spell: { spellbook: true, level: 1 } },
    });
    expect(e.activity.addItemConsume).toBeUndefined();
    expect(e.additionalActivities).toHaveLength(1);
    expect(e.additionalActivities[0].init).toEqual({ name: "Misty Step", type: "cast" });
    expect(e.additionalActivities[0].overrides).toMatchObject({ addSpellUuid: "Misty Step", data: { spell: { level: 2 } } });
  });

  it("falls back to the feature's Choose a Spell picks, taking the level from the spell list", () => {
    const e = build(SpellMastery, "Spell Mastery", {
      spells: [classSpell("Shield", 1), classSpell("Web", 2)],
      choices: [spellChoice("4-1", 2001), spellChoice("4-2", 2002)],
      options: [{ id: 2001, label: "Shield" }, { id: 2002, label: "Web" }, { id: 2003, label: "Fireball" }],
    });
    expect(e.masteredSpells).toEqual([
      { name: "Shield", level: 1, spent: 0 },
      { name: "Web", level: 2, spent: 0 },
    ]);
  });

  it("does not list a pick twice when both the flag and the choice name it", () => {
    const e = build(SpellMastery, "Spell Mastery", {
      spells: [classSpell("Shield", 1, { baseLevelAtWill: true })],
      choices: [spellChoice("4-1", 2001)],
      options: [{ id: 2001, label: "Shield" }],
    });
    expect(e.masteredSpells.map((s: any) => s.name)).toEqual(["Shield"]);
  });
});

describe("Wizard SignatureSpells", () => {
  it("casts each signature spell at level 3 with its own once per Short Rest use", () => {
    const e = build(SignatureSpells, "Signature Spells", {
      spells: [
        // DDB's real shape: isSignatureSpell stays null, the at-will level and a 1/SR use mark the pick
        classSpell("Fireball", 3, { isSignatureSpell: null, atWillLimitedUseLevel: 3, usesSpellSlot: false, limitedUse: { maxUses: 1, resetType: 1, numberUsed: 1 } }),
        classSpell("Counterspell", 3, { isSignatureSpell: true, atWillLimitedUseLevel: 3 }),
        classSpell("Magic Missile", 1, { baseLevelAtWill: true }),
      ],
    });
    expect(e.type).toBe("cast");
    expect(e.activity).toEqual({
      name: "Fireball",
      addSpellUuid: "Fireball",
      noSpellslot: true,
      addActivityConsume: true,
      data: {
        spell: { spellbook: true, level: 3 },
        uses: { spent: 1, max: "1", recovery: [{ period: "sr", type: "recoverAll" }] },
      },
    });
    expect(e.additionalActivities[0].overrides).toMatchObject({
      addSpellUuid: "Counterspell",
      addActivityConsume: true,
      data: { uses: { spent: 0, max: "1" } },
    });
    // Spell Mastery's pick is not a signature spell
    expect(e.masteredSpells.map((s: any) => s.name)).toEqual(["Fireball", "Counterspell"]);
  });
});
