// Characterization tests for DDBAttackAction: weapon/feat document choice and
// the attack-flavoured build() output.

// CharacterFeatureFactory must load first, it initialises the feature class chain
import "../../../src/parser/features/CharacterFeatureFactory";
import DDBAttackAction from "../../../src/parser/features/DDBAttackAction";
import DDBEnricherFactoryMixin from "../../../src/parser/enrichers/mixins/DDBEnricherFactoryMixin";
import {
  makeDdbAction,
  makeDdbCharacterData,
  makeDdbDice,
  makeRawCharacter,
} from "../../_fixtures/ddb/factories";
import { installActivityConfigStubs, installDocumentStub, repairEnricherDataStatics } from "../../_fixtures/ddb/stubs";

beforeAll(async () => {
  installActivityConfigStubs();
  installDocumentStub();
  await repairEnricherDataStatics();
  // enricher.init() builds a summons manager backed by real compendia which do
  // not exist in the test environment; everything else on the enricher is real.
  vi.spyOn(DDBEnricherFactoryMixin.prototype, "init").mockResolvedValue(undefined);
});

// build() swallows errors via try/catch and logs them; rethrow from the logger
// so a broken pipeline fails these tests loudly.
beforeEach(async () => {
  const { logger } = await import("../../../src/lib/_module");
  vi.spyOn(logger as any, "error").mockImplementation((...args: any[]) => {
    throw args[1] instanceof Error ? args[1] : new Error(JSON.stringify(args));
  });
});

function buildAttackAction({ action = {}, character = {}, raw = {}, type = "class" }: {
  action?: Record<string, any>;
  character?: Record<string, any>;
  raw?: Record<string, any>;
  type?: string;
} = {}): any {
  const ddbAction = makeDdbAction({ displayAsAttack: true, ...action });
  const ddbData = makeDdbCharacterData({
    character: {
      actions: { race: [], class: [ddbAction], feat: [], item: [], background: [] },
      ...character,
    },
  });
  return new DDBAttackAction({
    ddbData,
    ddbDefinition: ddbAction,
    rawCharacter: makeRawCharacter(raw),
    type,
  } as any);
}

describe("DDBAttackAction._init", () => {
  it("defaults to a feat document for ordinary attack actions", () => {
    const action = buildAttackAction();
    expect(action.isAction).toBe(true);
    expect(action.documentType).toBe("feat");
    expect(action.data.type).toBe("feat");
  });

  it("forces a weapon document for FORCE_WEAPON_FEATURES names", () => {
    const action = buildAttackAction({ action: { name: "Unarmed Strike" } });
    expect(action.documentType).toBe("weapon");
    expect(action.data.type).toBe("weapon");
  });

  it("reports displayAsAttack from the DDB definition", () => {
    expect(buildAttackAction().displayAsAttack()).toBe(true);
  });
});

describe("DDBAttackAction.build weapon documents", () => {
  // "Bite" is a FORCE_WEAPON_FEATURES natural weapon with no name-matched
  // enricher, so the build output is the plain pipeline behaviour.
  async function buildBite(actionOverrides: Record<string, any> = {}): Promise<any> {
    const action = buildAttackAction({
      action: {
        name: "Bite",
        actionType: 1,
        attackTypeRange: 1,
        attackSubtype: 2,
        abilityModifierStatId: 1,
        damageTypeId: 2,
        dice: makeDdbDice({ diceValue: 4, diceString: "1d4" }),
        ...actionOverrides,
      },
      type: "race",
    });
    await action.loadEnricher();
    await action.build();
    return action;
  }

  it("equips and identifies the weapon and copies proficiency", async () => {
    const action = await buildBite();
    expect(action.documentType).toBe("weapon");
    expect(action.data.system.proficient).toBe(true);
    expect(action.data.system.equipped).toBe(true);
    expect(action.data.system.rarity).toBe("");
    expect(action.data.system.identified).toBe(true);
  });

  it("copies a lack of proficiency", async () => {
    const action = await buildBite({ isProficient: false });
    expect(action.data.system.proficient).toBe(false);
  });

  it("generates base weapon damage, range and natural weapon type", async () => {
    const action = await buildBite();
    expect(action.data.system.damage.base).toMatchObject({
      number: 1,
      denomination: 4,
      bonus: "@mod",
      types: ["piercing"],
    });
    expect(action.data.system.range).toEqual({ value: 5, units: "ft", long: null });
    // "Bite" is a NATURAL_WEAPONS name
    expect(action.data.system.type.value).toBe("natural");
  });

  it("generates an attack activity with melee natural classification", async () => {
    const action = await buildBite();
    const activities = Object.values(action.data.system.activities) as any[];
    expect(activities).toHaveLength(1);
    const activity = activities[0];
    expect(activity.type).toBe("attack");
    expect(activity.attack.ability).toBe("str");
    expect(activity.attack.type).toEqual({ value: "melee", classification: "natural" });
    // weapon documents keep damage parts on the item and the activity
    // (the attack activity schema still carries an empty damage object)
    // in some cases the enricher will generate damage on the activity as a bonus
    expect(activity.damage.parts).toEqual([]);
  });

  it("generates an aoe self range and target for aoe weapon actions", async () => {
    const action = await buildBite({
      range: {
        range: null, longRange: null, aoeType: 1, aoeSize: 30,
        hasAoeSpecialDescription: false, minimumRange: null,
      },
    });
    expect(action.data.system.range).toEqual({ value: null, units: "self", long: null });
    expect(action.data.system.target).toEqual({ value: 30, type: "cone", units: "ft", reach: null });
  });
});

describe("DDBAttackAction.build feat documents", () => {
  it("puts attack damage on the activity for feat documents", async () => {
    const action = buildAttackAction({
      action: {
        name: "Tail Swipe",
        actionType: 1,
        attackTypeRange: 2,
        abilityModifierStatId: 2,
        damageTypeId: 2,
        dice: makeDdbDice({ diceValue: 8, diceString: "1d8" }),
      },
    });
    await action.loadEnricher();
    await action.build();

    expect(action.documentType).toBe("feat");
    const activities = Object.values(action.data.system.activities) as any[];
    expect(activities).toHaveLength(1);
    const activity = activities[0];
    expect(activity.type).toBe("attack");
    expect(activity.attack.ability).toBe("dex");
    expect(activity.attack.type).toEqual({ value: "ranged", classification: "weapon" });
    // the attack block only flips includeBase when damage is generated before
    // the attack; DDBFeatureActivity generates the attack first, so it stays false
    expect(activity.damage.includeBase).toBe(false);
    expect(activity.damage.parts).toHaveLength(1);
    expect(activity.damage.parts[0]).toMatchObject({
      number: 1,
      denomination: 8,
      bonus: "@mod",
      types: ["piercing"],
    });
  });

  it("prefers a save activity when the attack has a save stat", async () => {
    const action = buildAttackAction({
      action: {
        name: "Poison Spray",
        actionType: 1,
        attackTypeRange: 1,
        saveStatId: 3,
        abilityModifierStatId: 5,
      },
    });
    await action.loadEnricher();
    await action.build();

    const activities = Object.values(action.data.system.activities) as any[];
    expect(activities).toHaveLength(1);
    expect(activities[0].type).toBe("save");
    expect(activities[0].save.ability).toEqual(["con"]);
  });

  it("marks martial arts attacks and adds the finesse property", async () => {
    const action = buildAttackAction({
      action: {
        name: "Focused Strike",
        actionType: 1,
        attackTypeRange: 1,
        abilityModifierStatId: 1,
        isMartialArts: true,
        dice: makeDdbDice({ diceValue: 4, diceString: "1d4" }),
      },
    });
    await action.loadEnricher();
    await action.build();

    expect(action.data.flags.ddbimporter.dndbeyond.type).toBe("Martial Arts");
    expect(action.data.system.properties).toContain("fin");
  });
});
