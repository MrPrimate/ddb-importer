// Characterization tests for DDBAction: construction, system type resolution,
// damage/attack helpers and the build() pipeline output.

// CharacterFeatureFactory must load first, it initialises the feature class chain
import "../../../src/parser/features/CharacterFeatureFactory";
import DDBAction from "../../../src/parser/features/DDBAction";
import DDBEnricherFactoryMixin from "../../../src/parser/enrichers/mixins/DDBEnricherFactoryMixin";
import {
  makeDdbAction,
  makeDdbCharacterData,
  makeDdbClass,
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

interface IBuildActionOptions {
  action?: Record<string, any>;
  character?: Record<string, any>;
  raw?: Record<string, any>;
  type?: string;
  actionKey?: "class" | "race" | "feat";
}

function buildAction({ action = {}, character = {}, raw = {}, type = "class", actionKey = "class" }: IBuildActionOptions = {}): any {
  const ddbAction = makeDdbAction(action);
  const actions: Record<string, any[]> = { race: [], class: [], feat: [], item: [], background: [] };
  actions[actionKey].push(ddbAction);
  const ddbData = makeDdbCharacterData({ character: { actions, ...character } });
  return new DDBAction({
    ddbData,
    ddbDefinition: ddbAction,
    rawCharacter: makeRawCharacter(raw),
    type,
  } as any);
}

describe("DDBAction construction", () => {
  it("builds a feat data stub flagged as an action", () => {
    const action = buildAction();
    expect(action.isAction).toBe(true);
    expect(action.documentType).toBe("feat");
    expect(action.data.type).toBe("feat");
    expect(action.data.name).toBe("Test Action");
    expect(action.originalName).toBe("Test Action");
    expect(action.data.flags.ddbimporter.action).toBe(true);
    expect(action.data.flags.ddbimporter.id).toBe(90001);
    expect(action.data.flags.ddbimporter.componentId).toBe(80001);
    // actions never override the mixin's default tag type of "other"
    expect(action.data.flags.ddbimporter.type).toBe("other");
  });

  it("defaults to 2014 rules when the definition carries no sources", () => {
    const action = buildAction();
    expect(action.is2014).toBe(true);
    expect(action.is2024).toBe(false);
    expect(action.data.system.source.rules).toBe("2014");
  });

  it("honours a rename stored against the action in character values", () => {
    const action = buildAction({
      raw: {
        characterValues: [
          { typeId: 8, valueId: "90001", valueTypeId: "222216831", value: "Renamed Action" },
        ],
      },
    });
    expect(action.data.name).toBe("Renamed Action");
    expect(action.originalName).toBe("Test Action");
  });
});

describe("DDBAction._generateSystemType", () => {
  it("marks the item as a class feature when the action lives in actions.class", () => {
    const action = buildAction({ actionKey: "class" });
    action._generateSystemType();
    expect(action.data.system.type.value).toBe("class");
  });

  it("marks the item as a race feature when the action lives in actions.race", () => {
    const action = buildAction({ actionKey: "race", type: "race" });
    action._generateSystemType();
    expect(action.data.system.type.value).toBe("race");
  });

  it("marks the item as a feat feature when the action lives in actions.feat", () => {
    const action = buildAction({ actionKey: "feat", type: "feat" });
    action._generateSystemType();
    expect(action.data.system.type.value).toBe("feat");
  });

  it("uses the type nudge when the action is in none of the action lists", () => {
    const ddbAction = makeDdbAction();
    const action: any = new DDBAction({
      ddbData: makeDdbCharacterData(),
      ddbDefinition: ddbAction,
      rawCharacter: makeRawCharacter(),
      type: "class",
    } as any);
    action._generateSystemType("race");
    expect(action.data.system.type.value).toBe("race");
    expect(action.data.flags.ddbimporter.type).toBe("race");
  });

  it("generates a weapon type for weapon documents", () => {
    const action = buildAction({ action: { attackTypeRange: 1 } });
    action.documentType = "weapon";
    action._generateSystemType();
    expect(action.data.system.type.value).toBe("simpleM");
  });

  it("prefers natural weapon typing for natural weapon names", () => {
    const action = buildAction({ action: { name: "Bite", attackTypeRange: 1 } });
    action.documentType = "weapon";
    action._generateSystemType();
    expect(action.data.system.type.value).toBe("natural");
  });
});

describe("DDBAction.isMeleeOrRangedAction", () => {
  it("is truthy for attackTypeRange", () => {
    expect(buildAction({ action: { attackTypeRange: 1 } }).isMeleeOrRangedAction()).toBeTruthy();
  });

  it("is truthy for rangeId", () => {
    expect(buildAction({ action: { rangeId: 2 } }).isMeleeOrRangedAction()).toBeTruthy();
  });

  it("is falsy when neither is set", () => {
    expect(buildAction().isMeleeOrRangedAction()).toBeFalsy();
  });
});

describe("DDBAction.getDamage", () => {
  it("adds @mod for melee/ranged actions with an ability stat", () => {
    const damage = buildAction({
      action: { dice: makeDdbDice(), abilityModifierStatId: 1, attackTypeRange: 1, damageTypeId: 1 },
    }).getDamage();
    expect(damage.number).toBe(1);
    expect(damage.denomination).toBe(6);
    expect(damage.bonus).toBe("@mod");
    expect(damage.types).toEqual(["bludgeoning"]);
  });

  it("omits @mod when the action is not melee or ranged", () => {
    const damage = buildAction({
      action: { dice: makeDdbDice(), abilityModifierStatId: 1, damageTypeId: 1 },
    }).getDamage();
    expect(damage.bonus).toBe("");
  });

  it("omits @mod for offhand attacks", () => {
    const damage = buildAction({
      action: { dice: makeDdbDice(), abilityModifierStatId: 1, attackTypeRange: 1, isOffhand: true },
    }).getDamage();
    expect(damage.bonus).toBe("");
  });

  it("returns undefined when there is no dice or fixed value", () => {
    expect(buildAction().getDamage()).toBeUndefined();
  });

  it("uses martial arts damage with the action die for non martial artists", () => {
    const damage = buildAction({
      action: { dice: makeDdbDice({ diceValue: 4, diceString: "1d4" }), isMartialArts: true, damageTypeId: 1 },
    }).getDamage();
    expect(damage.number).toBe(1);
    expect(damage.denomination).toBe(4);
    expect(damage.bonus).toBe("@mod");
  });

  it("uses the martial arts scale die for martial artists", () => {
    const monk = makeDdbClass({
      definition: { id: 50002, name: "Monk" },
      classFeatures: [
        {
          definition: { id: 71001, name: "Martial Arts", requiredLevel: 1 },
          levelScale: { dice: makeDdbDice({ diceValue: 8, diceString: "1d8" }) },
        },
      ],
    });
    const damage = buildAction({
      action: { dice: makeDdbDice({ diceValue: 4, diceString: "1d4" }), isMartialArts: true },
      character: { classes: [monk] },
    }).getDamage();
    expect(damage.number).toBe(1);
    expect(damage.denomination).toBe(8);
    expect(damage.bonus).toBe("@mod");
  });
});

describe("DDBAction.getActionAttackAbility", () => {
  it("maps the ability modifier stat id", () => {
    expect(buildAction({ action: { abilityModifierStatId: 4 } }).getActionAttackAbility()).toBe("int");
    expect(buildAction({ action: { abilityModifierStatId: 1 } }).getActionAttackAbility()).toBe("str");
  });

  it("returns an empty string with no stat and no martial arts", () => {
    expect(buildAction().getActionAttackAbility()).toBe("");
  });

  it("falls back to the default ability for a martial arts action without a martial artist", () => {
    const ability = buildAction({
      action: { abilityModifierStatId: 1, isMartialArts: true },
    }).getActionAttackAbility();
    expect(ability).toBe("str");
  });

  it("picks the higher of dex and str for martial artists", () => {
    const monk = makeDdbClass({
      definition: { id: 50002, name: "Monk" },
      classFeatures: [{ definition: { id: 71001, name: "Martial Arts", requiredLevel: 1 } }],
    });
    const effectAbilities = {
      str: { value: 10 }, dex: { value: 16 }, con: { value: 10 },
      int: { value: 10 }, wis: { value: 10 }, cha: { value: 10 },
    };
    const dexAction = buildAction({
      action: { abilityModifierStatId: 1, isMartialArts: true },
      character: { classes: [monk] },
      raw: { effectAbilities },
    });
    expect(dexAction.getActionAttackAbility()).toBe("dex");

    const strAbilities = { ...effectAbilities, dex: { value: 10 }, str: { value: 18 } };
    const strAction = buildAction({
      action: { abilityModifierStatId: 1, isMartialArts: true },
      character: { classes: [monk] },
      raw: { effectAbilities: strAbilities },
    });
    expect(strAction.getActionAttackAbility()).toBe("str");
  });
});

describe("DDBAction.getBonusDamage", () => {
  it("returns an empty string for non martial arts actions", () => {
    expect(buildAction().getBonusDamage()).toBe("");
  });

  it("sums unarmed-attack bonus modifiers for martial arts actions", () => {
    const action = buildAction({
      action: { isMartialArts: true },
      character: {
        modifiers: {
          class: [],
          race: [
            {
              type: "bonus", subType: "unarmed-attacks", value: 2,
              isGranted: true, restriction: "", statId: null, componentId: 1, componentTypeId: 1,
            },
          ],
          background: [], item: [], feat: [], condition: [],
        },
      },
    });
    expect(action.getBonusDamage()).toBe(2);
  });
});

describe("DDBAction._generateProperties", () => {
  const kiClass = () => makeDdbClass({
    definition: { id: 50002, name: "Monk" },
    level: 6,
    classFeatures: [{ definition: { id: 71002, name: "Ki-Empowered Strikes", requiredLevel: 6 } }],
  });

  it("adds the magical property to Unarmed Strike for ki-empowered monks", () => {
    const action = buildAction({
      action: { name: "Unarmed Strike" },
      character: { classes: [kiClass()] },
    });
    action._generateProperties();
    expect(action.data.system.properties).toContain("mgc");
  });

  it("does not add the magical property to other actions", () => {
    const action = buildAction({ character: { classes: [kiClass()] } });
    action._generateProperties();
    expect(action.data.system.properties).not.toContain("mgc");
  });

  it("does not add the magical property below the required level", () => {
    const lowMonk = kiClass();
    lowMonk.level = 5;
    const action = buildAction({
      action: { name: "Unarmed Strike" },
      character: { classes: [lowMonk] },
    });
    action._generateProperties();
    expect(action.data.system.properties).not.toContain("mgc");
  });
});

describe("DDBAction.build", () => {
  // build() swallows errors via try/catch and logs them; rethrow from the
  // logger so a broken pipeline fails these tests loudly instead of leaving
  // silently half-built data.
  beforeEach(async () => {
    const { logger } = await import("../../../src/lib/_module");
    vi.spyOn(logger as any, "error").mockImplementation((...args: any[]) => {
      throw args[1] instanceof Error ? args[1] : new Error(JSON.stringify(args));
    });
  });

  it("builds a save activity when the action has a save stat", async () => {
    const action = buildAction({
      action: {
        name: "Breath Attack",
        saveStatId: 3,
        abilityModifierStatId: 5,
        description: "<p>Each creature within range must make a saving throw.</p>",
      },
    });
    await action.loadEnricher();
    await action.build();

    const activities = Object.values(action.data.system.activities) as any[];
    expect(activities).toHaveLength(1);
    const activity = activities[0];
    expect(activity.type).toBe("save");
    expect(activity.save.ability).toEqual(["con"]);
    expect(activity.save.dc.calculation).toBe("wis");
    expect(activity.activation).toEqual({ type: "action", value: 1, condition: "" });
    expect(action.data.system.type.value).toBe("class");
  });

  it("builds a utility activity with limited uses and item consumption", async () => {
    const action = buildAction({
      action: {
        name: "Focus Surge",
        limitedUse: {
          name: null, statModifierUsesId: null, resetType: 1, numberUsed: 1,
          minNumberConsumed: 1, maxNumberConsumed: 1, maxUses: 3, operator: 1,
          useProficiencyBonus: false, proficiencyBonusOperator: 1, resetDice: null,
        },
      },
    });
    await action.loadEnricher();
    await action.build();

    expect(action.data.system.uses.max).toBe("3");
    expect(action.data.system.uses.spent).toBe(1);
    const activities = Object.values(action.data.system.activities) as any[];
    expect(activities).toHaveLength(1);
    const activity = activities[0];
    expect(activity.type).toBe("utility");
    expect(activity.consumption.targets).toEqual([
      { type: "itemUses", target: "", value: 1, scaling: { mode: "", formula: "" } },
    ]);
  });

  it("flags 2014-only skipped actions", async () => {
    const action = buildAction({ action: { name: "Convert Sorcery Points" } });
    await action.loadEnricher();
    await action.build();
    expect(action.data.flags.ddbimporter.skip).toBe(true);
  });

  it("assembles the description from the DDB definition", async () => {
    const action = buildAction({
      action: { description: "<p>A test action.</p>", snippet: "" },
    });
    await action.loadEnricher();
    await action.build();
    expect(action.data.system.description.value).toBe("<p>A test action.</p>");
    expect(action.data.system.identifier).toBe("test-action");
  });
});
