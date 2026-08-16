/**
 * A cross-section of the branchier class enrichers, one or two per class.
 *
 * These target the conditional paths — `is2014`, `isAction`, subclass, chosen
 * option, level band — which the audit harness structurally cannot reach: a
 * capture exercises exactly the configuration it was taken from, so the other
 * side of every branch is invisible to it. The audit is also skipped entirely
 * in CI (its fixtures are a private submodule), which makes these the only
 * enricher assertions that run on a PR.
 *
 * These assert the enricher's *hints* — the getters a DDBFeature consumes —
 * not the built document. Whether a hint produces a working activity is a live
 * Foundry import question; whether the right hint is produced for the right
 * configuration is this file's job.
 *
 * The vi.mock preamble is required: importing a barrel (src/lib/_module,
 * src/parser/lib/_module, enrichers/effects/_module) while DDBEnricherData is
 * mid-evaluation pulls the apps/muncher tree and crashes SpellListExtractorMixin's
 * `extends DDBEnricherData`. The individual modules behind those barrels import
 * fine, so vi.importActual gives the real Utils/DDBDataUtils/ChangeHelper rather
 * than fakes. vi.mock is hoisted per file and cannot be shared from tests/_fixtures.
 */
const loggerMock = vi.hoisted(() => ({
  warn: vi.fn(),
  debug: vi.fn(),
  info: vi.fn(),
  error: vi.fn(),
  verbose: vi.fn(),
}));

// DDBDataUtils cannot be resolved inside the mock factory: it imports DDBClass,
// which re-enters the enricher tree the mock exists to break out of. It is a bag
// of statics called from enricher getters at test time, so an empty object filled
// in beforeAll from the real module gives real behaviour with workable ordering.
const parserLib = vi.hoisted(() => ({ DDBDataUtils: {} as any, DDBTemplateStrings: {} as any }));

vi.mock("../../../src/lib/_module", async () => ({
  logger: loggerMock,
  utils: (await vi.importActual<any>("../../../src/lib/Utils")).default,
}));
vi.mock("../../../src/parser/spells/CharacterSpellFactory", () => ({ default: class {} }));
vi.mock("../../../src/parser/spells/DDBSpell", () => ({ default: class {} }));
vi.mock("../../../src/parser/lib/_module", () => parserLib);
vi.mock("../../../src/parser/enrichers/effects/_module", async () => ({
  AutoEffects: {},
  EnchantmentEffects: {},
  ChangeHelper: (await vi.importActual<any>("../../../src/parser/enrichers/effects/ChangeHelper")).default,
  EffectGenerator: {},
}));

import * as ClassEnrichers from "../../../src/parser/enrichers/class/_module";
import Utils from "../../../src/lib/Utils";
import { makeEnricherData } from "../../_fixtures/ddb/factories";
import { installActivityConfigStubs } from "../../_fixtures/ddb/stubs";

beforeAll(async () => {
  // ChangeHelper's advantage/disadvantage getters read CONFIG.Dice.D20Roll.ADV_MODE
  installActivityConfigStubs();
  const { default: DDBDataUtils } = await import("../../../src/parser/lib/DDBDataUtils");
  for (const key of Object.getOwnPropertyNames(DDBDataUtils)) {
    if (typeof (DDBDataUtils as any)[key] === "function") {
      parserLib.DDBDataUtils[key] = (DDBDataUtils as any)[key].bind(DDBDataUtils);
    }
  }
  Object.assign(parserLib.DDBTemplateStrings, await import("../../../src/parser/lib/DDBTemplateStrings"));
});

type TEnricher = new (options: any) => any;

function build(Enricher: TEnricher, options: Parameters<typeof makeEnricherData>[1] = {}): any {
  return makeEnricherData(Enricher, options);
}

/** Most branches key off ddbParser.originalName rather than the enricher's own name. */
function named(Enricher: TEnricher, originalName: string, options: Record<string, any> = {}): any {
  return build(Enricher, { name: originalName, ddbParser: { originalName }, ...options });
}

describe("artificer FlashOfGenius", () => {
  it("is a reaction roll on the action and inert on the feature", () => {
    expect(build(ClassEnrichers.Artificer.FlashOfGenius, { isAction: true }).type).toBe("utility");
    expect(build(ClassEnrichers.Artificer.FlashOfGenius, { isAction: false }).type).toBe("none");
    expect(build(ClassEnrichers.Artificer.FlashOfGenius, { isAction: true }).activity.data.roll.formula)
      .toBe("max(@abilities.int.mod,1)");
    // the feature carries no activity of its own, so it must not carry a roll either
    expect(build(ClassEnrichers.Artificer.FlashOfGenius, { isAction: false }).activity).toEqual({});
  });

  it("only rewrites recovery for 2024 muncher imports", () => {
    const args = { isAction: true, ddbParser: { isMuncher: true } };
    expect(build(ClassEnrichers.Artificer.FlashOfGenius, { ...args, is2014: true }).override).toEqual({});
    // a character import keeps whatever DDB reported, so the override must stay empty
    expect(build(ClassEnrichers.Artificer.FlashOfGenius, { isAction: true }).override).toEqual({});
    expect(build(ClassEnrichers.Artificer.FlashOfGenius, args).override.uses.recovery)
      .toEqual([{ period: "lr", type: "recoverAll", formula: undefined }]);
  });
});

describe("barbarian FormOfTheBeastWeapons", () => {
  const Enricher = ClassEnrichers.Barbarian.FormOfTheBeastWeapons;

  it.each([
    ["Form of the Beast: Tail", "Tail Attack"],
    ["Form of the Beast: Claw", "Claw Attack"],
    ["Form of the Beast: Bite", "Bite Attack"],
    ["Form of the Beast: Tail (reaction)", "Tail (reaction)"],
  ])("names the %s activity %s", (originalName, activityName) => {
    expect(named(Enricher, originalName).activity.name).toBe(activityName);
  });

  it("gives the tail 10 ft reach and leaves the others at default", () => {
    expect(named(Enricher, "Form of the Beast: Tail").activity.data.range).toEqual({ value: 10, units: "ft" });
    expect(named(Enricher, "Form of the Beast: Claw").activity.data).toBeUndefined();
  });

  it("only the reaction tail suppresses the default activity type", () => {
    expect(named(Enricher, "Form of the Beast: Tail (reaction)").type).toBe("utility");
    expect(named(Enricher, "Form of the Beast: Tail").type).toBeNull();
  });

  it("adds the proficiency heal only to the bite", () => {
    const bite = named(Enricher, "Form of the Beast: Bite").additionalActivities;
    expect(bite).toHaveLength(1);
    expect(bite[0].init.name).toBe("Bite (Healing Bonus - 1/your turn)");
    expect(bite[0].build.healingPart.custom.formula).toBe("@prof");
    expect(named(Enricher, "Form of the Beast: Claw").additionalActivities).toEqual([]);
  });

  it("adds the AC effect to both tail variants only", () => {
    expect(named(Enricher, "Form of the Beast: Tail").effects[0].name).toBe("Form of the Beast: Tail AC Bonus");
    expect(named(Enricher, "Form of the Beast: Tail (reaction)").effects).toHaveLength(1);
    expect(named(Enricher, "Form of the Beast: Bite").effects).toEqual([]);
  });

  it("makes the weapon magical only once Bestial Soul is known", () => {
    const withoutFeature = named(Enricher, "Form of the Beast: Claw", {
      data: { system: { properties: ["fin"] } },
    });
    expect(withoutFeature.override.data["system.properties"]).toEqual(["fin"]);

    const withFeature = named(Enricher, "Form of the Beast: Claw", {
      data: { system: { properties: ["fin"] } },
      character: {
        classes: [{
          level: 6,
          definition: { name: "Barbarian" },
          subclassDefinition: null,
          classFeatures: [{ definition: { name: "Bestial Soul", requiredLevel: 6 } }],
        }],
      },
    });
    expect(withFeature.override.data["system.properties"]).toContain("mgc");
  });
});

describe("bard BragisRuneOfSpeech", () => {
  const Enricher = ClassEnrichers.Bard.BragisRuneOfSpeech;

  it("puts the save on the action and the other two modes on the feature", () => {
    const action = build(Enricher, { isAction: true });
    expect(action.type).toBe("save");
    expect(action.activity.name).toBe("Scorn");
    expect(action.additionalActivities).toEqual([]);

    const feature = build(Enricher, { isAction: false });
    expect(feature.type).toBe("none");
    expect(feature.additionalActivities.map((a: any) => a.init.name)).toEqual(["Eloquence", "Vitality"]);
  });

  it("spends Bardic Inspiration from its own item in every mode", () => {
    expect(build(Enricher, { isAction: true }).activity.itemConsumeTargetName).toBe("Bardic Inspiration");
    for (const activity of build(Enricher, { isAction: false }).additionalActivities) {
      expect(activity.overrides.itemConsumeTargetName).toBe("Bardic Inspiration");
    }
  });

  it("attaches the disadvantage effect only to the action", () => {
    expect(build(Enricher, { isAction: true }).effects[0]).toMatchObject({ name: "Scorn", activityMatch: "Scorn" });
    expect(build(Enricher, { isAction: false }).effects).toEqual([]);
  });
});

describe("cleric ChannelDivinity", () => {
  const Enricher = ClassEnrichers.Cleric.ChannelDivinity;

  it("gives 2014 only Turn Undead and no base activity", () => {
    const e = build(Enricher, { is2014: true });
    expect(e.activity).toBeNull();
    expect(e.additionalActivities.map((a: any) => a.init.name)).toEqual(["Turn Undead"]);
    expect(e.effects).toEqual([]);
    expect(e.override).toBeNull();
  });

  it("gives 2024 Divine Spark plus Turn Undead and the Turned effect", () => {
    const e = build(Enricher);
    expect(e.activity).toMatchObject({ type: "heal", name: "Divine Spark (Healing)" });
    expect(e.additionalActivities.map((a: any) => a.init.name))
      .toEqual(["Divine Spark (Save vs Damage)", "Turn Undead"]);
    expect(e.effects[0]).toMatchObject({ name: "Turned", statuses: ["Frightened", "Incapacitated"] });
  });

  it("recovers one 2024 use on a short rest and all on a long rest", () => {
    const e = build(Enricher, { actions: { class: [{ name: "Channel Divinity", limitedUse: { maxUses: 2, numberUsed: 1 } }] } });
    expect(e.override.uses.recovery).toEqual([
      { period: "sr", type: "formula", formula: "1" },
      { period: "lr", type: "recoverAll", formula: undefined },
    ]);
    expect(e.override.uses.spent).toBe(1);
  });
});

/**
 * The AC5e half of Potent Spellcasting. isCantripBoost in CharacterSpellFactory drops the baked-in
 * `+ @mod` when AC5e is installed, so if these effects stop being produced the bonus vanishes
 * silently. The audit harness cannot see them: ac5eOnly hints are filtered out unless the module
 * is active.
 */
describe("cleric and druid PotentSpellcasting", () => {
  it.each([
    ["Cleric", "cleric"],
    ["Druid", "druid"],
  ])("gives %s an AC5e only cantrip damage bonus keyed to its own class", (klass, identifier) => {
    const Enricher = klass === "Cleric"
      ? ClassEnrichers.Cleric.BlessedStrikesPotentSpellcasting
      : ClassEnrichers.Druid.ElementalFuryPotentSpellcasting;
    const e = build(Enricher);
    expect(e.effects).toHaveLength(1);
    expect(e.effects[0]).toMatchObject({ name: "Potent Spellcasting (Automation)", ac5eOnly: true });
    expect(e.effects[0].options.transfer).toBe(true);
    expect(e.effects[0].ac5eChanges).toEqual([{
      key: "flags.automated-conditions-5e.damage.bonus",
      value: `bonus=rollingActor.abilities.wis.mod; item.classIdentifier === '${identifier}' && isCantrip;`,
      type: "ac5e",
      priority: 2,
      phase: "initial",
    }]);
  });

  it("routes the bare 2014 and homebrew feature name to the cleric enricher", async () => {
    // 2014 Divine Domain and homebrew domains report "Potent Spellcasting" with no parent prefix,
    // which pascal-cases to a key the cleric barrel does not export
    const { default: DDBClassFeatureEnricher } = await import("../../../src/parser/enrichers/DDBClassFeatureEnricher");
    // NAME_HINTS is a class field, so it only exists on an instance
    const factory = new DDBClassFeatureEnricher({ activityGenerator: null as any });
    const hint = factory.NAME_HINTS["Potent Spellcasting"];
    expect(hint).toBe("Blessed Strikes: Potent Spellcasting");
    expect(ClassEnrichers.Cleric[Utils.pascalCase(hint) as keyof typeof ClassEnrichers.Cleric]).toBeDefined();
  });

  it("carries no activity on the cleric, and keeps the manual damage one on the druid", () => {
    expect(build(ClassEnrichers.Cleric.BlessedStrikesPotentSpellcasting).type).toBe("none");
    const druid = build(ClassEnrichers.Druid.ElementalFuryPotentSpellcasting);
    expect(druid.type).toBe("damage");
    expect(druid.activity.data.damage.parts[0].types).toEqual(["cold", "fire", "lightning", "thunder"]);
  });
});

describe("druid CircleForms", () => {
  it("builds the transform CR bands off the subclass identifier", () => {
    // real DDBDataUtils.classIdentifierName, so "Circle of the Moon" -> "moon"
    const e = build(ClassEnrichers.Druid.CircleForms, { subKlass: "Circle of the Moon" });
    expect(e.type).toBe("transform");
    expect(e.activity.itemConsumeTargetName).toBe("Wild Shape");
    expect(e.activity.data.profiles.map((p: any) => p.cr)).toEqual([
      "max(1/4, @subclasses.moon.levels / 3)",
      "max(1/2, @subclasses.moon.levels / 3)",
      "max(1, @subclasses.moon.levels / 3)",
    ]);
  });

  it("degrades to a bare identifier when no subclass is set", () => {
    const e = build(ClassEnrichers.Druid.CircleForms);
    expect(e.activity.data.profiles[0].cr).toBe("max(1/4, @subclasses..levels / 3)");
  });
});

describe("fighter GraspingArrow", () => {
  const Enricher = ClassEnrichers.Fighter.GraspingArrow;

  it("puts the damage on the action and the riders on the feature", () => {
    const action = build(Enricher, { isAction: true });
    expect(action.type).toBe("damage");
    expect(action.additionalActivities).toEqual([]);
    expect(action.effects).toEqual([]);
    expect(action.addToDefaultAdditionalActivities).toBe(true);

    const feature = build(Enricher, { isAction: false });
    expect(feature.type).toBe("none");
    expect(feature.activity).toBeNull();
    expect(feature.additionalActivities).toHaveLength(2);
    expect(feature.additionalActivities[1].init.name).toBe("Escape Check");
    expect(feature.effects[0]).toMatchObject({ name: "Grasped", activityMatch: "Cast" });
  });

  it("scales the movement damage off the arcane shot scale", () => {
    const [movement] = build(Enricher, { isAction: false }).additionalActivities;
    expect(movement.duplicate).toBe(true);
    expect(movement.overrides.data.damage.parts[0].custom.formula)
      .toBe("@scale.arcane-archer.arcane-shot-options");
  });
});

describe("gunslinger Overkill", () => {
  const Enricher = ClassEnrichers.Gunslinger.Overkill;

  // Both halves of Overkill are applied to the inventory weapons themselves at
  // parse time (DDBItem.isFirearm / hasOverkillRangedDamage). This activity is
  // the manual fallback for a ranged weapon that was not imported from DDB.
  it("rolls 1d8 of the weapon's own damage type on a ranged weapon that already adds the modifier", () => {
    const e = build(Enricher);
    expect(e.type).toBe("damage");
    expect(e.activity.activationType).toBe("special");
    expect(e.activity.activationCondition).toMatch(/already adds your ability modifier/);
    expect(e.activity.data.damage.parts[0]).toMatchObject({
      number: 1,
      denomination: 8,
      types: ["bludgeoning", "piercing", "slashing"],
    });
  });

  it("notes that imported weapons handle both halves themselves", () => {
    const suffix = build(Enricher).override.descriptionSuffix;
    expect(suffix).toMatch(/Firearm property/);
    expect(suffix).toMatch(/extra 1d8/);
    expect(suffix).toMatch(/fallback/);
  });
});

describe("kindred BloodPotency", () => {
  it("pools Blood Points with no rest recovery and pulls both spenders", () => {
    // points come back by feeding, so a rest recovery here would be wrong
    const e = build(ClassEnrichers.Kindred.BloodPotency);
    expect(e.override.data.system.uses).toMatchObject({
      max: "@scale.kindred.blood-points",
      recovery: [],
    });
    expect(e.additionalActivities.map((a: any) => a.action.rename[0])).toEqual(["Heal Wounds", "Hunger Sated"]);
    for (const activity of e.additionalActivities) {
      // empty consume target = this item, i.e. the pool itself
      expect(activity.overrides).toEqual({ addItemConsume: true });
    }
  });
});

describe("monk ElementalAttunement", () => {
  const Enricher = ClassEnrichers.Monk.ElementalAttunement;

  it("is inert in 2014 and an enchantment in 2024", () => {
    expect(build(Enricher, { is2014: true }).type).toBeNull();
    expect(build(Enricher, { is2014: true }).activity).toEqual({});
    expect(build(Enricher, { is2014: true }).additionalActivities).toEqual([]);
    expect(build(Enricher, { is2014: true }).effects).toEqual([]);

    expect(build(Enricher).type).toBe("enchant");
    expect(build(Enricher).activity.name).toBe("Activate Attunement");
  });

  it("rides the strike and save activities off the enchantment by stable id", () => {
    // the effect names these ids, so a rename in one place silently unlinks them
    const e = build(Enricher);
    expect(e.additionalActivities.map((a: any) => a.overrides.id)).toEqual(["ddbElementStriAt", "ddbElementStriSa"]);
    expect(e.effects[0].data.flags.ddbimporter.activityRiders).toEqual(["ddbElementStriAt", "ddbElementStriSa"]);
  });
});

describe("monster-hunter CloseQuarters", () => {
  it("doubles the dice at level 11 through the formula, not a branch", () => {
    const e = build(ClassEnrichers.MonsterHunter.CloseQuarters);
    expect(e.activity.data.damage.parts[0].custom.formula)
      .toBe("(2 + 2 * floor(@classes.monster-hunter.levels / 11))d6");
    expect(e.activity.allowCritical).toBe(false);
    expect(e.effects[0].ac5eChanges[0].key).toBe("flags.automated-conditions-5e.attack.disadvantage");
  });
});

// same shape as pugilist DreadHand: the aura upgrade and the inspiration grant hang off the
// "Imbue Aura of Protection" choice option, so DDB omits them unless the toggle is on
describe("paladin PartyAnimal", () => {
  const Enricher = ClassEnrichers.Paladin.PartyAnimal;

  it("builds all three activities itself rather than from DDB actions", () => {
    const e = build(Enricher);
    expect(e.activity.name).toBe("Imbue Aura of Protection");
    expect(e.activity.activationType).toBe("bonus");
    expect(e.activity.addItemConsume).toBe(true);
    expect(e.activity.data.duration).toEqual({ value: "10", units: "minute" });
    expect(e.additionalActivities.map((a: any) => a.init?.name))
      .toEqual(["Aura of Fraternity: Party Animal", "Grant Heroic Inspiration"]);
    expect(e.additionalActivities.some((a: any) => a.action)).toBe(false);
  });

  it("upgrades the Aura of Fraternity die to 1d8", () => {
    expect(build(Enricher).additionalActivities[0].build.rollOverride)
      .toMatchObject({ formula: "1d8", name: "Roll" });
  });

  it("is inert on the action", () => {
    expect(build(Enricher, { isAction: true }).type).toBeNull();
    expect(build(Enricher, { isAction: true }).additionalActivities).toEqual([]);
  });
});

describe("paladin SacredWeapon", () => {
  const Enricher = ClassEnrichers.Paladin.SacredWeapon;

  it("uses the 2014 light radii and the larger 2024 ones", () => {
    const light = (e: any): Record<string, string> => Object.fromEntries(
      e.effects.flatMap((effect: any) => effect.changes ?? [])
        .filter((c: any) => c.key === "token.light.dim" || c.key === "token.light.bright")
        .map((c: any) => [c.key, c.value]),
    );
    expect(light(build(Enricher, { is2014: true }))).toMatchObject({ "token.light.dim": "5", "token.light.bright": "0" });
    expect(light(build(Enricher))).toMatchObject({ "token.light.dim": "40", "token.light.bright": "20" });
  });

  it("keeps the light toggle out of consumption in both rulesets", () => {
    for (const is2014 of [true, false]) {
      expect(build(Enricher, { is2014 }).override.ignoredConsumptionActivities).toEqual(["Sacred Weapon Light Toggle"]);
    }
  });
});

describe("pugilist BrawlersBestFriend", () => {
  it("summons a hound scaled off pugilist levels", () => {
    const e = build(ClassEnrichers.Pugilist.BrawlersBestFriend);
    expect(e.type).toBe("summon");
    expect(e.activity.data.bonuses).toMatchObject({
      ac: "@abilities.con.mod",
      hd: "@classes.pugilist.levels",
      hp: "@classes.pugilist.levels * 5",
    });
    expect(e.activity.data.match.ability).toBe("con");
  });
});

// the audit harness runs module-free, so its worksheet shows neither the ATL nor the AC5e
// half of this effect; the value strings are pinned here instead
describe("pugilist GrotesqueGrowth", () => {
  const Enricher = ClassEnrichers.Pugilist.GrotesqueGrowth;

  it("grants the Enlarge benefits on the feature and nothing on the action", () => {
    const e = build(Enricher);
    expect(e.effects).toHaveLength(1);
    expect(e.effects[0]).toMatchObject({ name: "Grotesque Growth", options: { durationSeconds: 60 } });
    expect(e.effects[0].changes.map((c: any) => [c.key, c.value])).toEqual([
      // ["system.traits.size", "lg"],
      ["system.abilities.str.check.roll.mode", "1"],
      ["system.abilities.str.save.roll.mode", "1"],
      ["system.bonuses.mwak.damage", "1d4"],
      ["system.bonuses.rwak.damage", "1d4"],
    ]);
    // the "Grotesque Growth" action resolves to this enricher too and is merged into the
    // feature, so emitting there as well would apply the growth twice
    expect(build(Enricher, { isAction: true }).effects).toEqual([]);
  });

  it("only the activation applies the growth, not the exhaustion restore", () => {
    // "Restore Grotesque Growth" buys the use back with a level of Exhaustion, it does not
    // end the effect, so it must not be an activity the effect links to
    expect(build(Enricher).effects[0].activitiesMatch).toEqual(["Grotesque Growth"]);
  });

  it("builds both activities itself rather than from DDB actions", () => {
    const e = build(Enricher);
    expect(e.activity.name).toBe("Grotesque Growth");
    expect(e.activity.addItemConsume).toBe(true);
    expect(e.additionalActivities.map((a: any) => a.init?.name)).toEqual(["Restore Grotesque Growth"]);
    // DDB renamed this action and hangs it off the sheet copy of the feature, so a name
    // lookup silently produced a feature with the activation alone
    expect(e.additionalActivities.some((a: any) => a.action)).toBe(false);
    expect(e.additionalActivities[0].build.consumptionOverride.targets[0])
      .toMatchObject({ type: "itemUses", value: -1 });
    expect(build(Enricher, { isAction: true }).additionalActivities).toEqual([]);
    expect(build(Enricher, { isAction: true }).type).toBeNull();
  });

  it("upgrades the token to Large and sets a 10 foot reach for AC5e", () => {
    const e = build(Enricher);
    expect(e.effects[0].atlChanges.map((c: any) => [c.key, c.type, c.value]))
      .toEqual([["ATL.width", "upgrade", "2"], ["ATL.height", "upgrade", "2"]]);
    expect(e.effects[0].ac5eChanges[0]).toMatchObject({
      key: "flags.automated-conditions-5e.range",
      value: "reach=10",
    });
  });
});

// Revenging Strike, Unslakeable Bloodlust and Whirlwind of Violence hang off the Dread Hand
// "Activate" choice option, so DDB omits them entirely unless the toggle is on. The mule
// captures were all taken with it on, which is why the audit never saw this.
describe("pugilist DreadHand", () => {
  const Enricher = ClassEnrichers.Pugilist.DreadHand;

  it("builds all four activities itself rather than from DDB actions", () => {
    const e = build(Enricher);
    expect(e.activity.name).toBe("Activate Dread Hand");
    expect(e.activity.addItemConsume).toBe(true);
    expect(e.activity.data.duration).toEqual({ value: "1", units: "minute" });
    expect(e.additionalActivities.map((a: any) => a.init?.name))
      .toEqual(["Revenging Strike", "Unslakeable Bloodlust", "Whirlwind of Violence"]);
    expect(e.additionalActivities.some((a: any) => a.action)).toBe(false);
  });

  it("makes Revenging Strike a reaction unarmed strike", () => {
    const strike = build(Enricher).additionalActivities[0];
    expect(strike.init.type).toBe("attack");
    expect(strike.build.activationOverride.type).toBe("reaction");
    expect(strike.build.rangeOverride).toMatchObject({ value: 5, units: "ft" });
    expect(strike.build.damageParts[0].custom.formula)
      .toBe("@scale.pugilist.fisticuffs + @abilities.str.mod");
  });

  it("does not spend the Dread Hand use on Whirlwind of Violence", () => {
    // the DDB action carried a limitedUse that consumed the feature's own use, which is wrong:
    // Whirlwind of Violence is free and once per turn
    const whirlwind = build(Enricher).additionalActivities[2];
    expect(whirlwind.build.generateConsumption).toBe(false);
  });

  it("is inert on the action", () => {
    expect(build(Enricher, { isAction: true }).type).toBeNull();
    expect(build(Enricher, { isAction: true }).activity).toEqual({});
    expect(build(Enricher, { isAction: true }).additionalActivities).toEqual([]);
  });
});

/**
 * The whole set of features whose activities DDB hangs off an "Activate X" choice option.
 * That option's actions are absent from the payload of any character who has not switched
 * the toggle on, so the enricher has to build the activities itself; naming a DDB action, or
 * leaving default action matching to find one, silently costs the feature the activity.
 *
 * The class audit replays each fixture with the toggles cleared and fails on a loss, but it
 * skips in CI (its fixtures are a private submodule), which makes this the guard that runs on
 * a PR. Activity names are pinned so a rename cannot quietly drop one.
 */
describe("toggle-gated features build their own activities", () => {
  const CASES: [string, any, string | null, string[]][] = [
    ["druid PetalDance", ClassEnrichers.Druid.PetalDance, "Conjure Petals",
      ["Petal Dance: Lunge", "Petal Dance: Protection"]],
    ["druid SymbioticBiosphere", ClassEnrichers.Druid.SymbioticBiosphere, "Symbiotic Biosphere: Release Pheromones",
      ["Symbiotic Biosphere: Retaliate"]],
    ["kindred FightingFury", ClassEnrichers.Kindred.FightingFury, "Fighting Fury",
      ["Fighting Fury: Swiftness"]],
    ["kindred LiveFastBeAGoodLookingCorpse", ClassEnrichers.Kindred.LiveFastBeAGoodLookingCorpse,
      "Live Fast, Be a Good Looking Corpse: Rapidity", ["Live Fast, Be a Good Looking Corpse: Rapidity (Turns)"]],
    ["kindred ProteanRewards", ClassEnrichers.Kindred.ProteanRewards, "Protean Rewards: Flesh of Marble",
      ["Gifts of Survival: Feral Fortitude (Flesh of Marble)"]],
    ["paladin AvatarOfNourishment", ClassEnrichers.Paladin.AvatarOfNourishment, "Avatar of Nourishment",
      ["Avatar of Nourishment: Restoration", "Avatar of Nourishment: Temp HP", "Avatar of Nourishment: Protection"]],
    ["paladin FormOfTheRiver", ClassEnrichers.Paladin.FormOfTheRiver, "Enter Form of the River",
      ["Aura of the River: Push Damage"]],
    ["paladin MythicSwashbuckler", ClassEnrichers.Paladin.MythicSwashbuckler, "Mythic Swashbuckler",
      ["Dash", "Disengage", "Swashbuckler Advantage"]],
    ["paladin PartyAnimal", ClassEnrichers.Paladin.PartyAnimal, "Imbue Aura of Protection",
      ["Aura of Fraternity: Party Animal", "Grant Heroic Inspiration"]],
    ["pugilist AuraOfResilience", ClassEnrichers.Pugilist.AuraOfResilience, "Aura of Resilience", []],
    ["pugilist DreadHand", ClassEnrichers.Pugilist.DreadHand, "Activate Dread Hand",
      ["Revenging Strike", "Unslakeable Bloodlust", "Whirlwind of Violence"]],
    ["pugilist GrotesqueGrowth", ClassEnrichers.Pugilist.GrotesqueGrowth, "Grotesque Growth",
      ["Restore Grotesque Growth"]],
    ["ranger FifthManifestation", ClassEnrichers.Ranger.FifthManifestation, "5th Manifestation",
      ["5th Manifestation: Corruption Strike"]],
    // a passive form with no activation of its own, so no base activity
    ["ranger Lycanthrope", ClassEnrichers.Ranger.Lycanthrope, null, ["Claws (Str.)", "Claws (Dex.)"]],
    ["sorcerer SandForm", ClassEnrichers.Sorcerer.SandForm, "Sand Form (Enter)",
      ["Sand Form (Damage Resistance)"]],
  ];

  it.each(CASES)("%s builds its activities without naming a DDB action", (_label, Enricher, base, additional) => {
    const e = build(Enricher);
    // AuraOfResilience has a base activity only, so it leaves the getter at its null default
    const hints = e.additionalActivities ?? [];
    expect(e.activity?.name ?? null).toBe(base);
    expect(hints.map((a: any) => a.init?.name)).toEqual(additional);
    expect(hints.some((a: any) => a.action)).toBe(false);
  });

  it.each(CASES)("%s stays inert on the action document", (_label, Enricher) => {
    const e = build(Enricher, { isAction: true });
    expect(e.type).toBeNull();
    expect(e.additionalActivities ?? []).toEqual([]);
  });

  it.each([
    ["druid PetalDance", ClassEnrichers.Druid.PetalDance, "Petal Dance: Protection",
      "@classes.druid.levels + @abilities.wis.mod", ["healing"]],
    ["paladin AvatarOfNourishment", ClassEnrichers.Paladin.AvatarOfNourishment, "Avatar of Nourishment: Restoration",
      "max(@abilities.cha.mod, 1)", ["healing"]],
    ["paladin AvatarOfNourishment", ClassEnrichers.Paladin.AvatarOfNourishment, "Avatar of Nourishment: Temp HP",
      "max(@abilities.cha.mod, 1)", ["temphp"]],
  ] as [string, any, string, string, string[]][])("%s rolls %s as a heal", (_label, Enricher, name, formula, types) => {
    const hint = build(Enricher).additionalActivities.find((a: any) => a.init?.name === name);
    expect(hint.init.type).toBe("heal");
    expect(hint.build.generateHealing).toBe(true);
    expect(hint.build.healingPart.custom.formula).toBe(formula);
    expect(hint.build.healingPart.types).toEqual(types);
  });
});

describe("ranger FoeSlayer", () => {
  const Enricher = ClassEnrichers.Ranger.FoeSlayer;

  it("is a midi optional bonus in 2014 and an enchantment in 2024", () => {
    const legacy = build(Enricher, { is2014: true });
    expect(legacy.type).toBeNull();
    expect(legacy.activity).toEqual({});
    expect(legacy.effects[0].midiOptionalChanges[0].data["damage.mwak"]).toBe("@abilities.wis.mod");

    const modern = build(Enricher);
    expect(modern.type).toBe("enchant");
    expect(modern.activity.data.restrictions).toEqual({ type: "spell", allowMagical: true });
    expect(modern.effects[0]).toMatchObject({ name: "Foe Slayer", type: "enchant" });
    expect(modern.effects[0].changes.map((c: any) => c.key)).toEqual(["name", "system.damage.parts"]);
  });
});

// makeEnricherData always supplies an empty document, so these exercise the
// weapon branch; the feat branch keys off document.type and is out of reach here.
describe("rogue PsychicBlade", () => {
  const Enricher = ClassEnrichers.Rogue.PsychicBlade;
  const buildWeapon = () => build(Enricher, {
    klass: "Rogue",
    data: { system: { properties: ["mgc"] } },
  });

  it("builds the blade as its own weapon", () => {
    expect(buildWeapon().override.data.name).toBe("Psychic Blade");
  });

  it("only applies to a rogue", () => {
    expect(build(Enricher, { klass: "Fighter" }).override).toBeNull();
  });

  it("retypes the blade to a simple melee weapon", () => {
    const system = buildWeapon().override.data.system;
    expect(system.type).toEqual({ value: "simpleM" });
    expect(system["type.value"]).toBeUndefined();
  });

  it("keeps the finesse and thrown properties alongside the parsed ones", () => {
    expect(buildWeapon().override.data.system.properties).toEqual(["fin", "thr", "mgc"]);
  });
});

describe("rogue TokensOfTheDeparted", () => {
  const Enricher = ClassEnrichers.Rogue.TokensOfTheDeparted;

  it("accepts all three spellings DDB has used for the sneak attack action", () => {
    // DDB has shipped "Wails From the Grave" and "Wails from the Grave"; all
    // three hints collapse to one renamed activity
    const names = build(Enricher).additionalActivities
      .filter((a: any) => a.action?.rename?.[0] === "Wails From the Grave")
      .map((a: any) => a.action.name);
    expect(names).toEqual([
      "Tokens of the Departed: Sneak Attack",
      "Wails From the Grave",
      "Wails from the Grave",
    ]);
  });

  it("inverts uses so the counter shows trinkets held, not spent", () => {
    const actions = { class: [{ name: "Soul Trinkets", limitedUse: { maxUses: 2, numberUsed: 2 } }] };
    // level 13 grants 3 trinkets; 2 "used" on DDB means 1 remaining here
    const e = build(Enricher, { actions, ddbParser: { _class: { level: 13 } } });
    expect(e.override.uses.max).toBe("@scale.phantom.tokens-of-the-departed");
    expect(e.override.uses.spent).toBe(1);
    expect(e.override.retainUseSpent).toBe(true);
  });

  it.each([
    [12, 2],
    [13, 3],
    [17, 4],
  ])("caps trinkets at level %i to %i", (level, max) => {
    const e = build(Enricher, { ddbParser: { _class: { level } } });
    expect(e._2024SoulTrinketMax).toBe(max);
  });

  it("uses the proficiency-based pool and a formula recovery in 2014", () => {
    const e = build(Enricher, { is2014: true, ddbParser: { ddbCharacter: { profBonus: 4 } } });
    expect(e.override.uses.max).toBe("@prof");
    expect(e.override.uses.recovery[0].type).toBe("formula");
  });
});

describe("shared PsionicPower", () => {
  const Enricher = ClassEnrichers.Shared.PsionicPower;

  it("gives Soulknife the knack and Psi Warrior the reaction field", () => {
    const soulknife = build(Enricher, { subKlass: "Soulknife" });
    expect(soulknife.activity.name).toBe("Psi-Bolstered Knack");
    expect(soulknife.activity.activationType).toBeUndefined();

    const psiWarrior = build(Enricher, { subKlass: "Psi Warrior" });
    expect(psiWarrior.activity.name).toBe("Protective Field");
    expect(psiWarrior.activity.activationType).toBe("reaction");
    expect(psiWarrior.activity.data.range).toEqual({ units: "ft", value: "30" });
  });

  it("slugs the energy die scale off the subclass", () => {
    expect(build(Enricher, { subKlass: "Psi Warrior" }).activity.data.roll.formula)
      .toBe("1@scale.psi-warrior.energy-die.die");
    expect(build(Enricher, { subKlass: "Soulknife" }).activity.data.roll.formula)
      .toBe("1@scale.soulknife.energy-die.die");
  });

  it("pulls the subclass's own extra actions", () => {
    expect(build(Enricher, { subKlass: "Soulknife" }).additionalActivities.map((a: any) => a.action.name))
      .toEqual(["Psionic Power: Psychic Whispers"]);
    expect(build(Enricher, { subKlass: "Psi Warrior" }).additionalActivities.map((a: any) => a.action.name))
      .toEqual(["Psionic Power: Psionic Strike", "Psionic Power: Telekinetic Movement"]);
  });

  it("adds the 2014-only Recovery action and its flat proficiency pool", () => {
    const legacy = build(Enricher, { subKlass: "Soulknife", is2014: true });
    expect(legacy.additionalActivities.map((a: any) => a.action.name)).toContain("Psionic Power: Recovery");
    expect(legacy.override.uses.max).toBe("@prof * 2");
    // 2014 has no short rest die back
    expect(legacy.override.uses.recovery).toEqual([{ period: "lr", type: "recoverAll", formula: undefined }]);

    const modern = build(Enricher, { subKlass: "Soulknife" });
    expect(modern.additionalActivities.map((a: any) => a.action.name)).not.toContain("Psionic Power: Recovery");
    expect(modern.override.uses.max).toBe("@scale.soulknife.energy-die.number");
    expect(modern.override.uses.recovery).toContainEqual({ period: "sr", type: "formula", formula: "1" });
  });
});

describe("sorcerer ElementalAffinity", () => {
  const Enricher = ClassEnrichers.Sorcerer.ElementalAffinity;

  it("enables only the chosen damage type's resistance", () => {
    const e = build(Enricher, { ddbParser: { _chosen: [{ label: "Fire Damage" }] } });
    const enabled = e.effects.filter((effect: any) => effect.options.transfer).map((effect: any) => effect.name);
    expect(enabled).toEqual(["Elemental Affinity, Resistance: Fire"]);
    // the other four still ship, disabled, so a DM can flip them
    expect(e.effects).toHaveLength(5);
    expect(e.effects.filter((effect: any) => effect.options.disabled)).toHaveLength(4);
  });

  it("falls back to the damage type in the feature name", () => {
    const e = build(Enricher, { name: "Elemental Affinity (Cold)" });
    expect(e.chosenDamageType).toBe("cold");
    expect(e.override.data.name).toBe("Elemental Affinity (Cold)");
  });

  it("leaves every resistance off for a muncher import with no character", () => {
    const e = build(Enricher, { name: "Elemental Affinity", ddbParser: { isMuncher: true } });
    expect(e.chosenDamageType).toBe("");
    expect(e.effects.every((effect: any) => effect.options.disabled)).toBe(true);
    expect(e.override.data.name).toBe("Elemental Affinity");
  });

  it("replaces the auto-generated resistance effects", () => {
    // DDB's own grantedModifiers would otherwise duplicate all five
    expect(build(Enricher).clearAutoEffects).toBe(true);
  });
});

describe("warlock GeniesVessel", () => {
  const Enricher = ClassEnrichers.Warlock.GeniesVessel;

  it.each([
    ["Genie's Wrath (Dao)", "bludgeoning"],
    ["Genie's Wrath (Djinni)", "thunder"],
    ["Genie's Wrath (Efreeti)", "fire"],
    ["Genie's Wrath (Marid)", "cold"],
  ])("gives %s %s damage", (originalName, damageType) => {
    const e = named(Enricher, originalName);
    expect(e.type).toBe("damage");
    expect(e.activity.data.damage.parts[0].types).toEqual([damageType]);
    expect(e.activity.data.damage.parts[0].custom.formula).toBe("@prof");
  });

  it("leaves the parent vessel feature inert", () => {
    const e = named(Enricher, "Genie's Vessel");
    expect(e.type).toBe("none");
    expect(e.activity).toBeNull();
  });

  it("produces no activity for an unrecognised genie kind", () => {
    expect(named(Enricher, "Genie's Wrath (Unknown)").activity).toBeNull();
  });
});

describe("warlock Malediction", () => {
  const Enricher = ClassEnrichers.Warlock.Malediction;

  /** every Horned King capture is level 20, so the pre-6 branch is fixture-invisible */
  function atWarlockLevel(level: number): any {
    return build(Enricher, {
      actions: {
        class: [{
          name: "Malediction",
          limitedUse: { statModifierUsesId: 6, resetType: 2, numberUsed: 0, maxUses: 0 },
        }],
      },
      character: {
        classes: [{
          level,
          definition: { name: "Warlock" },
          subclassDefinition: { name: "The Horned King (2014)" },
          classFeatures: [
            { definition: { name: "Malediction", requiredLevel: 1 } },
            { definition: { name: "Spiteful Curse", requiredLevel: 6 } },
          ],
        }],
      },
    });
  }

  it("gives each curse an action and a reaction activity", () => {
    const names = atWarlockLevel(5).additionalActivities.map((a: any) => a.init.name);
    // Agony and Hate are split by the roll they hamper, so the player picks up front
    // rather than being handed an effect with changes they have to delete
    expect(names).toEqual([
      "Agony (Concentration) (Action)",
      "Hate (Int) (Action)",
      "Hate (Wis) (Action)",
      "Hate (Cha) (Action)",
      "Rot (Action)",
      "Agony (Attack) (Reaction)",
      "Agony (Concentration) (Reaction)",
      "Hate (Int) (Reaction)",
      "Hate (Wis) (Reaction)",
      "Hate (Cha) (Reaction)",
      "Rot (Reaction)",
      "Rot Damage",
    ]);
    // the first curse action is the primary activity rather than an additional one
    expect(atWarlockLevel(5).activity.name).toBe("Agony (Attack) (Action)");
  });

  it("withholds Bestow Curse until Spiteful Curse is reached at 6th level", () => {
    const before = atWarlockLevel(5).additionalActivities.map((a: any) => a.init.name);
    expect(before).not.toContain("Cast Bestow Curse");

    const after = atWarlockLevel(6).additionalActivities;
    const cast = after.find((a: any) => a.init.name === "Cast Bestow Curse");
    expect(cast).toBeDefined();
    expect(cast.overrides.addSpellUuid).toBe("Bestow Curse");
    // spends the Spiteful Curse feature's own use, not a Malediction use
    expect(cast.overrides.itemConsumeTargetName).toBe("Spiteful Curse");
    // suppressed in FEATURE_SPELLS_IGNORE, so it must not re-add itself to the spellbook
    expect(cast.overrides.data.spell.spellbook).toBe(false);
    expect(cast.overrides.data.visibility).toEqual({
      identifier: "warlock",
      level: { min: 6, max: null },
    });
  });

  it("keeps the minimum of one use that DDB's maxUses 0 loses", () => {
    expect(atWarlockLevel(6).override.uses).toMatchObject({
      max: "max(1, @abilities.cha.mod)",
      recovery: [{ period: "lr", type: "recoverAll" }],
    });
  });

  it("links one effect to both forms of its curse", () => {
    const effects = atWarlockLevel(6).effects;
    expect(effects.map((e: any) => e.name)).toEqual([
      "Malediction: Agony (Attack)",
      "Malediction: Agony (Concentration)",
      "Malediction: Hate (Int)",
      "Malediction: Hate (Wis)",
      "Malediction: Hate (Cha)",
      "Malediction: Rot",
    ]);
    expect(effects[0].activitiesMatch).toEqual([
      "Agony (Attack) (Action)",
      "Agony (Attack) (Reaction)",
    ]);
    // the curse lasts until the end of the target's next turn, not the warlock's
    expect(effects[0].daeSpecialDurations).toContain("turnEnd");
    // each save-hampering curse carries exactly the one save it names
    expect(effects.slice(1, 5).map((e: any) => e.changes.map((c: any) => c.key))).toEqual([
      ["system.abilities.con.save.roll.mode"],
      ["system.abilities.int.save.roll.mode"],
      ["system.abilities.wis.save.roll.mode"],
      ["system.abilities.cha.save.roll.mode"],
    ]);
    expect(effects[4].activitiesMatch).toEqual(["Hate (Cha) (Action)", "Hate (Cha) (Reaction)"]);
    // core dnd5e has no attack roll mode, so the attack half is module-only
    expect(effects[0].changes).toEqual([]);
    expect(effects[0].midiChanges.map((c: any) => c.key)).toEqual(["flags.midi-qol.disadvantage.attack.all"]);
    expect(effects[0].ac5eChanges.map((c: any) => c.key)).toEqual(["flags.automated-conditions-5e.attack.disadvantage"]);
  });
});

describe("warlock SpitefulCurse", () => {
  it("holds only the pool the Malediction cast activity spends", () => {
    const e = build(ClassEnrichers.Warlock.SpitefulCurse);
    expect(e.type).toBe("none");
    expect(e.override.uses).toMatchObject({
      max: "1",
      recovery: [{ period: "lr", type: "recoverAll" }],
    });
    expect(e.override.descriptionSuffix).toContain("Malediction");
  });
});

describe("wizard ArcaneWard", () => {
  it("charges the ward with a negative consume value", () => {
    // consuming a negative amount is how the ward gains hit points
    const e = build(ClassEnrichers.Wizard.ArcaneWard);
    expect(e.activity.name).toBe("Create Ward");
    expect(e.activity.itemConsumeValue).toBe("-((2 *@classes.wizard.levels) + @abilities.int.mod)");
    expect(e.activity.data.uses).toMatchObject({ max: "1", recovery: [{ period: "lr", type: "recoverAll" }] });
  });
});

describe("blood-hunter CrimsonRite", () => {
  const Enricher = ClassEnrichers.BloodHunter.CrimsonRite;

  it("falls back to one generic Apply Rite when DDB captured no choices", () => {
    const e = build(Enricher);
    expect(e.knownRites).toEqual([]);
    expect(e.additionalActivities).toHaveLength(1);
    expect(e.effects).toHaveLength(1);
  });

  it("builds one Apply Rite and one enchantment per known rite", () => {
    const e = build(Enricher, {
      ddbParser: { ddbFeature: { definition: { id: 1, entityTypeId: 2 } } },
      character: {
        choices: {
          class: [
            { componentId: 1, componentTypeId: 2, type: 2, optionValue: 10, optionIds: [], parentChoiceId: null },
            { componentId: 1, componentTypeId: 2, type: 2, optionValue: 11, optionIds: [], parentChoiceId: null },
          ],
          choiceDefinitions: [{
            id: "2-2",
            options: [
              { id: 10, label: "Rite of the Flame", description: "" },
              { id: 11, label: "Rite of the Frozen", description: "" },
            ],
          }],
        },
      },
    });
    expect(e.knownRites).toEqual(["Rite of the Flame", "Rite of the Frozen"]);
    expect(e.additionalActivities).toHaveLength(2);
    expect(e.effects).toHaveLength(2);
  });
});

describe("illrigger InfernalConduit", () => {
  it("scales the transfer with the conduit dice pool", () => {
    const e = build(ClassEnrichers.Illrigger.InfernalConduit);
    expect(e.type).toBe("heal");
    expect(e.activity.addItemConsume).toBe(true);
    expect(e.activity.addScalingMode).toBe("amount");
    expect(e.activity.addConsumptionScalingMax).toBe("@scale.illrigger.infernal-conduit");
    expect(e.activity.data.healing).toMatchObject({ number: 1, denomination: 10 });
  });
});
