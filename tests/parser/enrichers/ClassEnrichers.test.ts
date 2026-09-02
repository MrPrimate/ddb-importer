/**
 * A cross-section of the branchier class enrichers, one or two per class.
 *
 * These target the conditional paths - `is2014`, `isAction`, subclass, chosen
 * option, level band - which the audit harness structurally cannot reach: a
 * capture exercises exactly the configuration it was taken from, so the other
 * side of every branch is invisible to it. The audit is also skipped entirely
 * in CI (its fixtures are a private submodule), which makes these the only
 * enricher assertions that run on a PR.
 *
 * These assert the enricher's *hints* - the getters a DDBFeature consumes -
 * not the built document. Whether a hint produces a working activity is a live
 * Foundry import question; whether the right hint is produced for the right
 * configuration is this file's job.
 *
 * No vi.mock preamble: DDBEnricherData and the enricher effects modules import
 * leaf modules directly, so the enricher tree loads first without re-entering
 * itself (pinned by tests/smoke/enricherFirstLoad.test.ts).
 */
import * as ClassEnrichers from "../../../src/parser/enrichers/class/_module";
import SoulOfTheStormGiant from "../../../src/parser/enrichers/feat/SoulOfTheStormGiant";
import * as GenericEnrichers from "../../../src/parser/enrichers/generic/_module";
import Utils from "../../../src/lib/Utils";
import { makeEnricherData } from "../../_fixtures/ddb/factories";
import { installActivityConfigStubs } from "../../_fixtures/ddb/stubs";

beforeAll(() => {
  // ChangeHelper's advantage/disadvantage getters read CONFIG.Dice.D20Roll.ADV_MODE
  installActivityConfigStubs();
});
type TEnricher = new (options: any) => any;

function build(Enricher: TEnricher, options: Parameters<typeof makeEnricherData>[1] = {}): any {
  return makeEnricherData(Enricher, options);
}

/** Most branches key off ddbParser.originalName rather than the enricher's own name. */
function named(Enricher: TEnricher, originalName: string, options: Record<string, any> = {}): any {
  return build(Enricher, { name: originalName, ddbParser: { originalName }, ...options });
}

describe("feat SoulOfTheStormGiant", () => {
  const Enricher = SoulOfTheStormGiant;
  const names = ["Aura Save (Strength DC)", "Aura Save (Wisdom DC)", "Aura Save (Charisma DC)"];

  it("emits one save activity per ability when the ASI choice is unknown (muncher)", () => {
    const e = build(Enricher);
    expect(e.additionalActivities.map((a: any) => a.init.name)).toEqual(names);
    expect(e.additionalActivities.map((a: any) => a.build.saveOverride.dc.calculation)).toEqual(["str", "wis", "cha"]);
    // every variant saves with Strength; only the DC ability differs
    for (const a of e.additionalActivities) expect(a.build.saveOverride.ability).toEqual(["str"]);
    const macro = e.activity.data.behaviors.find((b: any) => b.type === "ddbMacro");
    // prefix-resolves whichever variant the user keeps
    expect(macro.config.args).toEqual({ activityName: "Aura Save" });
    expect(macro.config.excludeSelf).toBe(true);
    expect(e.effects[1].activitiesMatch).toEqual(names);
  });

  it("emits a singular save keyed to the chosen ability on character imports", () => {
    const e = build(Enricher, { ddbParser: { _chosen: [{ label: "Wisdom" }] } });
    expect(e.additionalActivities).toHaveLength(1);
    expect(e.additionalActivities[0].init.name).toBe("Aura Save");
    expect(e.additionalActivities[0].build.saveOverride.dc.calculation).toBe("wis");
    expect(e.effects[1].activitiesMatch).toEqual(["Aura Save"]);
  });
});

describe("warlock CloakOfFlies", () => {
  it("activates a 5 ft aura whose region damages other creatures at turn start", () => {
    const e = build(ClassEnrichers.Warlock.CloakOfFlies);
    expect(e.type).toBe("utility");
    expect(e.activity.name).toBe("Activate Aura");
    expect(e.activity.data.target.template).toMatchObject({ type: "radius", size: "5" });
    const macro = e.activity.data.behaviors.find((b: any) => b.type === "ddbMacro");
    expect(macro.config.events).toEqual(["tokenTurnStart"]);
    // "any OTHER creature" - the warlock is excluded from their own aura
    expect(macro.config.excludeSelf).toBe(true);
    expect(macro.config.args).toEqual({ activityName: "Aura Damage" });
    const [damage] = e.additionalActivities;
    expect(damage.init).toEqual({ name: "Aura Damage", type: "damage" });
    expect(damage.build.damageParts[0].custom).toEqual({ enabled: true, formula: "max(0, @abilities.cha.mod)" });
    expect(damage.build.generateConsumption).toBe(false);
    const [effect] = e.effects;
    expect(effect.activityMatch).toBe("Activate Aura");
    expect(effect.changes).toEqual([
      expect.objectContaining({ key: "system.skills.itm.roll.mode", type: "add", value: "1" }),
    ]);
  });
});

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

describe("fighter native bonus checks", () => {
  const battleMasterOptions = {
    klass: "Fighter",
    character: {
      classes: [{
        level: 5,
        definition: { name: "Fighter" },
        subclassDefinition: { name: "Battle Master" },
        classFeatures: [{ definition: { name: "Combat Superiority", requiredLevel: 3 } }],
      }],
    },
  };

  it("rolls Commanding Presence as a Charisma skill check with its superiority die", () => {
    const e = build(ClassEnrichers.Fighter.ManeuverCommandingPresence, battleMasterOptions);
    expect(e.type).toBe("check");
    expect(e.activity).toMatchObject({
      name: "Commanding Presence Check",
      targetType: "self",
      activationType: "special",
      addItemConsume: true,
    });
    expect(e.activity.data.check).toEqual({
      associated: ["itm", "prf", "per"],
      ability: "cha",
      bonus: "@scale.battle-master.combat-superiority-die",
      dc: { calculation: "", formula: "" },
      visible: true,
    });
    expect(e.effects).toEqual([]);
  });

  it("uses each Tactical Assessment skill's normal ability", () => {
    const e = build(ClassEnrichers.Fighter.ManeuverTacticalAssessment, battleMasterOptions);
    expect(e.type).toBe("check");
    expect(e.activity.data.check).toMatchObject({
      associated: ["his", "inv", "ins"],
      ability: "",
      bonus: "@scale.battle-master.combat-superiority-die",
      visible: true,
    });
    expect(e.effects).toEqual([]);
  });

  it("rolls Grappling Strike on the fighter and leaves the opposing contest manual", () => {
    const e = build(ClassEnrichers.Fighter.ManeuverGrapplingStrike, battleMasterOptions);
    expect(e.type).toBe("check");
    expect(e.activity).toMatchObject({
      name: "Grappling Strike Check",
      targetType: "self",
      activationType: "bonus",
      addItemConsume: true,
    });
    expect(e.activity.activationCondition).toMatch(/opposing contest manually/);
    expect(e.activity.data.check).toMatchObject({
      associated: ["ath"],
      ability: "str",
      bonus: "@scale.battle-master.combat-superiority-die",
    });
    expect(e.effects).toEqual([]);
  });

  it("splits Ambush into a native Stealth check and the existing Initiative effect", () => {
    const e = build(ClassEnrichers.Fighter.ManeuverAmbush, battleMasterOptions);
    expect(e.type).toBe("check");
    expect(e.activity).toMatchObject({ name: "Stealth Check", targetType: "self", addItemConsume: true });
    expect(e.activity.data.check).toMatchObject({
      associated: ["ste"],
      ability: "dex",
      bonus: "@scale.battle-master.combat-superiority-die",
    });
    expect(e.additionalActivities).toEqual([expect.objectContaining({
      init: { name: "Initiative Bonus", type: "utility" },
      overrides: expect.objectContaining({ targetType: "self", addItemConsume: true }),
    })]);
    expect(e.effects).toHaveLength(1);
    expect(e.effects[0]).toMatchObject({
      name: "Ambush Bonus",
      activityMatch: "Initiative Bonus",
      daeSpecialDurations: ["Initiative"],
    });
    expect(e.effects[0].changes).toEqual([
      expect.objectContaining({ key: "system.attributes.init.roll.bonus" }),
    ]);
  });

  it("uses a d6 for maneuver feats without Combat Superiority", () => {
    const e = build(ClassEnrichers.Fighter.ManeuverCommandingPresence);
    expect(e.activity.data.check.bonus).toBe("1d6");
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

describe("Kindred class feature consumption targets", () => {
  const CONSUMERS = [
    ["BurningWrath", ClassEnrichers.Kindred.BurningWrath],
    ["FightingFury", ClassEnrichers.Kindred.FightingFury],
    ["LiveFastBeAGoodLookingCorpse", ClassEnrichers.Kindred.LiveFastBeAGoodLookingCorpse],
    ["ProteanRewards", ClassEnrichers.Kindred.ProteanRewards],
  ] as const;

  it.each(CONSUMERS)("%s uses the portable Blood Potency identifier", (_name, Enricher) => {
    expect(build(Enricher).activity.itemConsumeTargetName).toBe("feat:blood-potency");
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
      ["system.traits.size", "1"],
      ["system.abilities.str.check.roll.mode", "1"],
      ["system.abilities.str.save.roll.mode", "1"],
      ["system.rolls.damage.mwak.bonus", "1d4"],
      ["system.rolls.damage.rwak.bonus", "1d4"],
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

  it("grows one size category and sets a 10 foot reach for AC5e", () => {
    const e = build(Enricher);
    // one size step on the actor; dnd5e derives the token dimensions from size
    expect(e.effects[0].changes[0]).toMatchObject({ key: "system.traits.size", type: "add", value: "1" });
    expect(e.effects[0].tokenChanges).toBeUndefined();
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

describe("toggle-gated helpers retain their DDB action snippets", () => {
  const CASES: [string, any, [string, string][]][] = [
    ["barbarian VitalityOfTheTree", ClassEnrichers.Barbarian.VitalityOfTheTree,
      [["Life-Giving Force", "Life-Giving Force"]]],
    ["blood hunter HybridTransformation", ClassEnrichers.BloodHunter.HybridTransformation,
      [["Bloodlust", "Bloodlust"]]],
    ["druid PetalDance", ClassEnrichers.Druid.PetalDance, [
      ["Petal Dance: Lunge", "Petal Dance: Lunge"],
      ["Petal Dance: Protection", "Petal Dance: Protection"],
    ]],
    ["druid SymbioticBiosphere", ClassEnrichers.Druid.SymbioticBiosphere,
      [["Symbiotic Biosphere: Retaliate", "Symbiotic Biosphere: Retaliate"]]],
    ["kindred FightingFury", ClassEnrichers.Kindred.FightingFury,
      [["Fighting Fury: Swiftness", "Fighting Fury: Swiftness"]]],
    ["kindred ProteanRewards", ClassEnrichers.Kindred.ProteanRewards, [[
      "Gifts of Survival: Feral Fortitude (Flesh of Marble)",
      "Gifts of Survival: Feral Fortitude (Flesh of Marble)",
    ]]],
    ["paladin AvatarOfNourishment", ClassEnrichers.Paladin.AvatarOfNourishment, [
      ["Avatar of Nourishment: Restoration", "Avatar of Nourishment: Restoration"],
      ["Avatar of Nourishment: Temp HP", "Avatar of Nourishment: Restoration"],
      ["Avatar of Nourishment: Protection", "Avatar of Nourishment: Protection"],
    ]],
    ["paladin BurningSpirit", ClassEnrichers.Paladin.BurningSpirit, [
      ["Vengeful Flame", "Vengeful Flame"],
      ["Restore Burning Spirit", "Restore Burning Spirit"],
    ]],
    ["paladin MythicSwashbuckler", ClassEnrichers.Paladin.MythicSwashbuckler, [
      ["Dash", "Dash"],
      ["Disengage", "Disengage"],
      ["Swashbuckler Advantage", "Swashbuckler Advantage"],
    ]],
    ["paladin PartyAnimal", ClassEnrichers.Paladin.PartyAnimal, [
      ["Aura of Fraternity: Party Animal", "Aura of Fraternity: Party Animal"],
      ["Grant Heroic Inspiration", "Grant Heroic Inspiration"],
    ]],
    ["pugilist DreadHand", ClassEnrichers.Pugilist.DreadHand,
      [["Whirlwind of Violence", "Whirlwind of Violence"]]],
    ["ranger FifthManifestation", ClassEnrichers.Ranger.FifthManifestation,
      [["5th Manifestation: Corruption Strike", "5th Manifestation: Corruption Strike"]]],
    ["ranger Lycanthrope", ClassEnrichers.Ranger.Lycanthrope, [
      ["Claws (Str.)", "Claws (Str.)"],
      ["Claws (Dex.)", "Claws (Dex.)"],
    ]],
    ["ranger TakeGhastlyForm", ClassEnrichers.Ranger.TakeGhastlyForm,
      [["Unnerving Aura", "Unnerving Aura"]]],
    ["ranger WrathOfTheWild", ClassEnrichers.Ranger.WrathOfTheWild,
      [["Unnerving Aura", "Unnerving Aura"]]],
    ["sorcerer SandForm", ClassEnrichers.Sorcerer.SandForm,
      [["Sand Form (Damage Resistance)", "Sand Form (Damage Resistance)"]]],
  ];

  it.each(CASES)("%s selects the source action for every synthesized helper", (_label, Enricher, expected) => {
    const hints = build(Enricher).additionalActivities;
    // `true` derives the lookup from the activity name (and the parser type),
    // so the effective lookup name is the init/overrides name in that case.
    const lookups = hints
      .filter((hint: any) => hint.overrides?.useActivitySnippet)
      .map((hint: any) => [
        hint.init.name,
        hint.overrides.useActivitySnippet === true
          ? hint.overrides.name ?? hint.init.name
          : hint.overrides.useActivitySnippet.name,
      ]);

    expect(lookups).toEqual(expected);
  });
});

describe("formatted-section fallback helpers", () => {
  it.each([
    ["druid WoodWose", ClassEnrichers.Druid.WoodWose, "Elderwood Sap"],
    ["paladin NobleScion", ClassEnrichers.Paladin.NobleScion, "Minor Wish"],
    ["pugilist DreadHand", ClassEnrichers.Pugilist.DreadHand, "Revenging Strike"],
    ["pugilist DreadHand", ClassEnrichers.Pugilist.DreadHand, "Unslakeable Bloodlust"],
  ] as [string, any, string][])("%s lets %s use the parent section fallback", (_label, Enricher, name) => {
    const hint = build(Enricher).additionalActivities.find((entry: any) => entry.init?.name === name);

    expect(hint).toBeDefined();
    expect(hint.overrides?.useActivitySnippet).toBeUndefined();
  });
});

describe("primary activities with narrower DDB action snippets", () => {
  const CASES: [string, any, string][] = [
    ["barbarian ManeuverShapeOfTheBehemoth", ClassEnrichers.Barbarian.ManeuverShapeOfTheBehemoth,
      "Embody Behemoth"],
    ["barbarian Permafrost", ClassEnrichers.Barbarian.Permafrost, "Extend Rage"],
    ["bard DazzlingFootwork", ClassEnrichers.Bard.DazzlingFootwork, "Bardic Damage"],
    ["bard UnbreakableMajesty", ClassEnrichers.Bard.UnbreakableMajesty, "Assume Unbreakable Majesty"],
    ["blood hunter AetherWalk", ClassEnrichers.BloodHunter.AetherWalk, "Aether Walk"],
    ["blood hunter BloodCurseOfBinding", ClassEnrichers.BloodHunter.BloodCurseOfBinding,
      "Blood Curse of Binding"],
    ["blood hunter BloodCurseOfBloatedAgony", ClassEnrichers.BloodHunter.BloodCurseOfBloatedAgony,
      "Blood Curse of Bloated Agony"],
    ["blood hunter BloodCurseOfCorrosion", ClassEnrichers.BloodHunter.BloodCurseOfCorrosion,
      "Blood Curse of Corrosion"],
    ["blood hunter BloodCurseOfExposure", ClassEnrichers.BloodHunter.BloodCurseOfExposure,
      "Blood Curse of Exposure"],
    ["blood hunter BloodCurseOfTheAnxious", ClassEnrichers.BloodHunter.BloodCurseOfTheAnxious,
      "Blood Curse of the Anxious"],
    ["blood hunter BloodCurseOfTheExorcist", ClassEnrichers.BloodHunter.BloodCurseOfTheExorcist,
      "Blood Curse of the Exorcist"],
    ["blood hunter BloodCurseOfTheFallenPuppet", ClassEnrichers.BloodHunter.BloodCurseOfTheFallenPuppet,
      "Blood Curse of the Fallen Puppet"],
    ["blood hunter BloodCurseOfTheMarked", ClassEnrichers.BloodHunter.BloodCurseOfTheMarked,
      "Blood Curse of the Marked"],
    ["blood hunter BloodCurseOfTheSouleater", ClassEnrichers.BloodHunter.BloodCurseOfTheSouleater,
      "Blood Curse of the Souleater"],
    ["blood hunter RiteFocusTheArchfey", ClassEnrichers.BloodHunter.RiteFocusTheArchfey,
      "Rite Focus - The Archfey"],
    ["blood hunter RiteFocusTheCelestial", ClassEnrichers.BloodHunter.RiteFocusTheCelestial,
      "Rite Focus - The Celestial"],
    ["blood hunter RiteFocusTheFathomless", ClassEnrichers.BloodHunter.RiteFocusTheFathomless,
      "Rite Focus - The Fathomless"],
    ["blood hunter RiteFocusTheGenie", ClassEnrichers.BloodHunter.RiteFocusTheGenie,
      "Rite Focus - The Genie"],
    ["blood hunter RiteFocusTheGreatOldOne", ClassEnrichers.BloodHunter.RiteFocusTheGreatOldOne,
      "Rite Focus - The Great Old One"],
    ["blood hunter RiteFocusTheHexblade", ClassEnrichers.BloodHunter.RiteFocusTheHexblade,
      "Rite Focus - The Hexblade"],
    ["blood hunter RiteFocusTheUndead", ClassEnrichers.BloodHunter.RiteFocusTheUndead,
      "Rite Focus - The Undead"],
    ["blood hunter RiteFocusTheUndying", ClassEnrichers.BloodHunter.RiteFocusTheUndying,
      "Rite Focus - The Undying"],
    ["druid AncientProtector", ClassEnrichers.Druid.AncientProtector, "Vengeance of the Elders"],
    ["druid PetalDance", ClassEnrichers.Druid.PetalDance, "Conjure Petals"],
    ["druid StarryForm", ClassEnrichers.Druid.StarryForm, "Assume Starry Form"],
    ["druid SymbioticBiosphere", ClassEnrichers.Druid.SymbioticBiosphere,
      "Symbiotic Biosphere: Release Pheromones"],
    ["druid WoodWose", ClassEnrichers.Druid.WoodWose, "Wood Wose"],
    ["kindred LiveFastBeAGoodLookingCorpse", ClassEnrichers.Kindred.LiveFastBeAGoodLookingCorpse,
      "Live Fast, Be a Good Looking Corpse: Rapidity"],
    ["kindred ProteanRewards", ClassEnrichers.Kindred.ProteanRewards,
      "Protean Rewards: Flesh of Marble"],
    ["paladin AvatarOfNourishment", ClassEnrichers.Paladin.AvatarOfNourishment, "Avatar of Nourishment"],
    ["paladin BurningSpirit", ClassEnrichers.Paladin.BurningSpirit, "Activate Burning Spirit"],
    ["paladin MythicSwashbuckler", ClassEnrichers.Paladin.MythicSwashbuckler, "Mythic Swashbuckler"],
    ["paladin NobleScion", ClassEnrichers.Paladin.NobleScion, "Activate Noble Scion"],
    ["paladin PartyAnimal", ClassEnrichers.Paladin.PartyAnimal, "Imbue Aura of Protection"],
    ["pugilist GrotesqueGrowth", ClassEnrichers.Pugilist.GrotesqueGrowth, "Grotesque Growth"],
    ["ranger FifthManifestation", ClassEnrichers.Ranger.FifthManifestation, "5th Manifestation"],
    ["ranger SetTrapMiasma", ClassEnrichers.Ranger.SetTrapMiasma, "Create Magical Trap"],
    ["ranger WrathOfTheWild", ClassEnrichers.Ranger.WrathOfTheWild, "Take Ghastly Form"],
    ["sorcerer InnateSorcery", ClassEnrichers.Sorcerer.InnateSorcery, "Innate Sorcery"],
  ];

  it.each(CASES)("%s selects %s", (_label, Enricher, name) => {
    const activity = build(Enricher).activity;
    const hint = activity.useActivitySnippet;
    // `true` derives the lookup name from the activity's own name; the object
    // form is retained where the activity name is not the action name.
    const lookupName = hint === true ? activity.name : hint?.name;

    expect(hint).toBeTruthy();
    expect(lookupName).toBe(name);
  });

  it.each([
    ["barbarian BolsteringMagic", ClassEnrichers.Barbarian.BolsteringMagic],
    ["fighter ActionSurge", ClassEnrichers.Fighter.ActionSurge],
    ["monk HandOfHealing", ClassEnrichers.Monk.HandOfHealing],
    ["monk HandOfUltimateMercy", ClassEnrichers.Monk.HandOfUltimateMercy],
    ["paladin DreadLord", ClassEnrichers.Paladin.DreadLord],
    ["paladin FormOfTheRiver", ClassEnrichers.Paladin.FormOfTheRiver],
    ["sorcerer SandForm", ClassEnrichers.Sorcerer.SandForm],
  ] as [string, any][])("%s keeps the complete parent feature snippet", (_label, Enricher) => {
    expect(build(Enricher).activity.useActivitySnippet).toBeUndefined();
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

describe("rogue Psychic Teleportation", () => {
  it("rolls the Psionic Energy Die before offering a maximum-range native teleport", () => {
    const e = build(ClassEnrichers.Rogue.SoulBladesPsychicTeleportation);
    expect(e.type).toBe("utility");
    expect(e.activity).toMatchObject({
      name: "Roll Psychic Teleportation Distance",
      data: {
        roll: {
          formula: "@scale.soulknife.energy-die.die * 10",
          name: "Roll Distance Die (multiply by 10 feet)",
        },
      },
    });

    const [teleport] = e.additionalActivities;
    expect(teleport.init).toEqual({ name: "Psychic Teleportation", type: "teleport" });
    expect(teleport.build).toMatchObject({
      generateConsumption: false,
      rangeOverride: {
        value: "10 * @scale.soulknife.energy-die.faces",
        units: "ft",
      },
      activationOverride: { type: "special" },
      targetOverride: { prompt: false, affects: { count: "1", type: "self" } },
    });
    expect(teleport.overrides).toMatchObject({ noConsumeTargets: true });
    expect(e.override.ignoredConsumptionActivities).toEqual(["Psychic Teleportation"]);
  });

  it("keeps the planner free when the action activities are folded into Soul Blades", () => {
    const e = build(ClassEnrichers.Rogue.SoulBlades);
    expect(e.override.ignoredConsumptionActivities).toEqual(["Psychic Teleportation"]);
  });

  it.each([
    [false, "Psychic Blades: Homing Strikes"],
    [true, "Soul Blades: Homing Strikes"],
  ])("loads the %s Homing Strikes action's unique snippet onto the copied activity", (is2014, name) => {
    const [homingStrikes] = build(ClassEnrichers.Rogue.SoulBlades, { is2014 }).additionalActivities;

    expect(homingStrikes).toMatchObject({
      action: { name, type: "class" },
      overrides: {
        useActivitySnippet: { name, type: "class" },
      },
    });
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
    expect(effects[0].options.expiry).toBe("targetEnd");
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

describe("blood-hunter HybridTransformation level bands", () => {
  const Enricher = ClassEnrichers.BloodHunter.HybridTransformation;

  // Feral Might damage (3rd/11th/18th) and the Improved Predatory Strikes attack bonus
  // (7th/11th/18th) from Stalker's Prowess, which is hybrid form only and so lives here
  const EXPECTED = [
    { level: { min: null, max: 6 }, denomination: 6, attackBonus: 0, effectId: "ddbLycanForm0001", action: "ddbLycanStrike01" },
    { level: { min: 7, max: 10 }, denomination: 6, attackBonus: 1, effectId: "ddbLycanForm0001", action: "ddbLycanStrike21" },
    { level: { min: 11, max: 17 }, denomination: 8, attackBonus: 2, effectId: "ddbLycanForm0002", action: "ddbLycanStrike11" },
    { level: { min: 18, max: null }, denomination: 8, attackBonus: 3, effectId: "ddbLycanForm0003", action: "ddbLycanStrike31" },
  ];

  it("builds one strike pair per band, carrying that band's attack bonus", () => {
    const e = build(Enricher);
    const strikes = e.additionalActivities.filter((a: any) => a.init.name.startsWith("Predatory Strike"));
    expect(strikes).toHaveLength(EXPECTED.length * 2);
    expect(e.additionalActivities.at(-1).init.name).toBe("Bloodlust");

    for (const [index, band] of EXPECTED.entries()) {
      const pair = strikes.slice(index * 2, index * 2 + 2);
      expect(pair.map((a: any) => a.init.name)).toEqual(["Predatory Strike", "Predatory Strike (Bonus Action)"]);
      expect(pair[0].overrides.id).toBe(band.action);
      const expectedBonus = band.attackBonus > 0
        ? `${Enricher.ATTACK_BONUS} + ${band.attackBonus}`
        : Enricher.ATTACK_BONUS;
      for (const activity of pair) {
        expect(activity.overrides.data.attack.bonus).toBe(expectedBonus);
        expect(activity.overrides.data.attack.type.classification).toBe("unarmed");
        expect(activity.build.damageParts[0].custom.formula).toContain(`1d${band.denomination}`);
      }
    }
  });

  it("binds each band's enchantment to its own strikes, sharing the +1 rider effect", () => {
    const e = build(Enricher);
    const profiles = e.effects.filter((effect: any) => effect.type === "enchant");
    const riders = e.effects.filter((effect: any) => effect.type !== "enchant");

    // the two d6 bands differ only in attack bonus, so they share the Feral Might +1 effect
    expect(riders.map((r: any) => r.data._id)).toEqual(["ddbLycanForm0001", "ddbLycanForm0002", "ddbLycanForm0003"]);
    expect(profiles).toHaveLength(EXPECTED.length);

    for (const [index, band] of EXPECTED.entries()) {
      const flags = profiles[index].data.flags.ddbimporter;
      expect(flags.effectIdLevel).toEqual(band.level);
      expect(flags.effectRiders).toEqual([band.effectId]);
      expect(flags.activityRiders[0]).toBe(band.action);
    }
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

describe("Storm Herald aura emanations", () => {
  it.each([
    ["StormAuraDesert", "Shielding Storm: Desert", "fire"],
    ["StormAuraSea", "Shielding Storm: Sea", "lightning"],
    ["StormAuraTundra", "Shielding Storm: Tundra", "cold"],
  ])("%s adds an Activate Aura emanation applying %s at barbarian 10+ when Aura Effects is absent", (name, effectName, damageType) => {
    const e = build((ClassEnrichers.Barbarian as any)[name]);
    const [aura] = e.additionalActivities;
    expect(aura.init.name).toBe("Activate Aura");
    expect(aura.build.targetOverride.template).toMatchObject({ type: "radius", size: "10" });
    expect(aura.overrides.data.visibility.identifier).toBe("barbarian");
    const [behavior] = aura.overrides.data.behaviors;
    expect(behavior).toMatchObject({
      type: "applyActiveEffect",
      level: { min: 10, max: null },
      ddbimporter: { auraeffectsNever: true },
      config: { effects: [effectName], sizes: [], types: [] },
    });
    const standalone = e.effects.find((effect: any) => effect.name === effectName);
    expect(standalone).toMatchObject({ standalone: true, auraeffectsNever: true });
    expect(standalone.changes[0]).toMatchObject({ key: "system.traits.dr.value", value: damageType });
  });

  it("Shielding Storm's embedded aura effects are auraeffects-only", () => {
    const e = build((ClassEnrichers.Barbarian as any).ShieldingStorm);
    for (const effect of e.effects) expect(effect.auraeffectsOnly).toBe(true);
  });
});

describe("Aura of War", () => {
  // "Choose one of the following damage types: Acid, Cold, Fire, Lightning, or
  // Thunder ... deal an extra 1d4 damage of the chosen type"
  const TYPES = ["Acid", "Cold", "Fire", "Lightning", "Thunder"];

  it("gives each damage type its own activation activity, with the type in the effect's bonus", () => {
    const e = build((ClassEnrichers.Artificer as any).AuraOfWar);

    // the first type takes the parsed activity, the rest are duplicates of it
    expect(e.activity.name).toBe("Activate Aura of War: Acid");
    expect(e.activity.targetType).toBe("ally");
    expect(e.activity.data.behaviors[0]).toMatchObject({
      type: "applyActiveEffect",
      ddbimporter: { auraeffectsNever: true },
      config: { effects: ["Aura of War: Acid"] },
    });

    const duplicates = e.additionalActivities.filter((a: any) => a.duplicate);
    expect(duplicates.map((a: any) => a.overrides.name)).toEqual(
      TYPES.slice(1).map((t) => `Activate Aura of War: ${t}`),
    );
    for (const activity of duplicates) {
      expect(activity.overrides.targetType).toBe("ally");
      expect(activity.overrides.data.behaviors[0].config.effects)
        .toEqual([activity.overrides.name.replace("Activate ", "")]);
    }
    // the default duplicate id is derived from the cloned activity, so four
    // clones would otherwise collide on one key
    const ids = duplicates.map((a: any) => a.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids.every((id: string) => id.length === 16)).toBe(true);
  });

  it("bakes the damage type into each standalone effect's bonus formula", () => {
    const e = build((ClassEnrichers.Artificer as any).AuraOfWar);
    for (const label of TYPES) {
      const standalone = e.effects.find((effect: any) => effect.standalone && effect.name === `Aura of War: ${label}`);
      expect(standalone).toMatchObject({ auraeffectsNever: true });
      expect(standalone.changes.map((c: any) => [c.key, c.value])).toEqual([
        ["system.rolls.damage.mwak.bonus", `1d4[${label.toLowerCase()}]`],
        ["system.rolls.damage.rwak.bonus", `1d4[${label.toLowerCase()}]`],
      ]);
    }
  });

  it("links each Aura Effects arm to its own activity rather than transferring it", () => {
    const e = build((ClassEnrichers.Artificer as any).AuraOfWar);
    const arms = e.effects.filter((effect: any) => effect.auraeffects);
    expect(arms).toHaveLength(TYPES.length);
    for (const arm of arms) {
      expect(arm.auraeffectsOnly).toBe(true);
      expect(arm.activityMatch).toBe(`Activate ${arm.name}`);
      // five always-on transfer effects would radiate every damage type at once
      expect(arm.options?.transfer).toBeUndefined();
    }
  });
});

describe("activated aura dual-arm conversions", () => {
  it.each([
    ["Paladin", "ExaltedChampion", "Exalted Champion: Aura"],
    ["Druid", "WrathOfTheSea", "Ocean Spray"],
  ])("%s %s applies %s natively when Aura Effects is absent", (klass, name, effectName) => {
    const e = build((ClassEnrichers as any)[klass][name]);
    const behavior = e.activity.data.behaviors.find((b: any) => b.type === "applyActiveEffect");
    expect(behavior.config.effects).toEqual([effectName]);
    expect(behavior.ddbimporter.auraeffectsNever).toBe(true);
    const standalone = e.effects.find((effect: any) => effect.standalone && effect.name === effectName);
    expect(standalone.auraeffectsNever).toBe(true);
    const auraeffectsArm = e.effects.find((effect: any) => effect.auraeffects && effect.name === effectName);
    expect(auraeffectsArm.auraeffectsOnly).toBe(true);
  });

  it("Wrath of the Sea targets enemies so the region derives hostile dispositions", () => {
    const e = build(ClassEnrichers.Druid.WrathOfTheSea);
    expect(e.activity.targetType).toBe("enemy");
  });

  it.each([
    ["Sorcerer", "LunarEmpowerment", "Full Moon", "Full Moon Aura"],
    ["Barbarian", "WildSurge", "6: Multicolored Light (AC Bonus)", "Multicolored Light AC Bonus"],
  ])("%s %s adds the emanation to its %s activity", (klass, name, activityName, effectName) => {
    const e = build((ClassEnrichers as any)[klass][name]);
    const additional = e.additionalActivities.find((a: any) => a.init.name === activityName);
    const target = additional.overrides.data.target;
    expect(target.template).toMatchObject({ type: "radius", size: "10" });
    expect(target.affects?.type ?? additional.overrides.targetType).toBe("ally");
    const [behavior] = additional.overrides.data.behaviors;
    expect(behavior.config.effects).toEqual([effectName]);
    const standalone = e.effects.find((effect: any) => effect.standalone && effect.name === effectName);
    expect(standalone.auraeffectsNever).toBe(true);
  });
});

describe("passive aura native fallback", () => {
  function makePaladinAura(originalName: string) {
    return named(GenericEnrichers.AuraOf as any, originalName, {
      klass: "Paladin",
      data: { name: originalName, flags: {}, system: { description: { value: "" } } },
    });
  }

  it("AuraOf places an ally emanation whose behavior applies the moved auto effect", () => {
    const e = makePaladinAura("Aura of Courage");
    expect(e.type).toBe("utility");
    expect(e.activity.name).toBe("Place Aura");
    expect(e.activity.targetType).toBe("ally");
    expect(e.activity.data.target.template.size).toBe("@scale.paladin.aura-of-protection");
    const [behavior] = e.activity.data.behaviors;
    expect(behavior.config.effects).toEqual(["Aura of Courage"]);
    expect(behavior.ddbimporter).toMatchObject({ auraeffectsNever: true });
    const [move, decorate] = e.effects;
    expect(move).toMatchObject({ noCreate: true, standalone: true, originReplacement: true, auraeffectsNever: true });
    expect(decorate.auraeffectsOnly).toBe(true);
  });

  it("Aura of Protection defers to AC5e's native aura when it is installed", () => {
    const e = makePaladinAura("Aura of Protection");
    const [behavior] = e.activity.data.behaviors;
    expect(behavior.ddbimporter).toMatchObject({ auraeffectsNever: true, ac5eNever: true });
    const ac5eHint = e.effects.find((h: any) => h.ac5eOnly);
    expect(ac5eHint.ac5eChanges).toHaveLength(1);
    const move = e.effects.find((h: any) => h.standalone);
    expect(move.ac5eNever).toBe(true);
  });

  it("Aura of Hate filters the region to fiends and undead natively", () => {
    const e = build(ClassEnrichers.Paladin.AuraOfHate);
    const [behavior] = e.activity.data.behaviors;
    expect(behavior.config.types).toEqual(["fiend", "undead"]);
    const standalone = e.effects.find((h: any) => h.standalone);
    expect(standalone).toMatchObject({ originReplacement: true, auraeffectsNever: true });
  });

  it.each([
    ["AuraOfAlacrity", "@scale.glory.aura-of-alacrity"],
    ["AuraOfTheSentinel", "@scale.watchers.aura-of-the-sentinel"],
  ])("%s places its emanation with the class scale radius", (name, scale) => {
    const e = build((ClassEnrichers.Paladin as any)[name]);
    expect(e.activity.data.target.template.size).toBe(scale);
    expect(e.effects[0]).toMatchObject({ noCreate: true, standalone: true, auraeffectsNever: true });
  });
});

describe("C/D region candidates: class features", () => {
  it("Spreading Spores triggers the pulled Halo of Spores save on entry and turn start", () => {
    const e = build(ClassEnrichers.Druid.SpreadingSpores);
    const macro = e.activity.data.behaviors.find((b: any) => b.type === "ddbMacro");
    expect(macro.config.events).toEqual(["tokenEnter", "tokenTurnStart"]);
    expect(macro.config.args.activityName).toBe("Save vs Spore Damage");
  });

  it("Twilight Sanctuary regains its 30 ft emanation and grants temp HP on turn end", () => {
    const e = build(ClassEnrichers.Cleric.ChannelDivinityTwilightSanctuary);
    expect(e.activity.data.target.template).toMatchObject({ type: "radius", size: "30" });
    expect(e.activity.targetType).toBe("ally");
    const macro = e.activity.data.behaviors.find((b: any) => b.type === "ddbMacro");
    expect(macro.config.events).toEqual(["tokenTurnEnd"]);
    expect(macro.config.args.activityName).toBe("Temp HP");
  });

  it.each([
    ["Wizard", "EventHorizon"],
    ["Sorcerer", "SpellBlind"],
  ])("%s %s activates as a utility and saves hostile creatures starting their turn inside", (klass, name) => {
    const e = build((ClassEnrichers as any)[klass][name]);
    expect(e.type).toBe("utility");
    const macro = e.activity.data.behaviors.find((b: any) => b.type === "ddbMacro");
    expect(macro.config.events).toEqual(["tokenTurnStart"]);
    expect(macro.config.args.activityName).toBe("Ongoing Save");
    const ongoing = e.additionalActivities.find((a: any) => a.init?.name === "Ongoing Save");
    expect(ongoing.build.generateConsumption).toBe(false);
    expect(ongoing.build.activationOverride.type).toBe("special");
  });
});

describe("paladin capstone aura regions", () => {
  it.each([
    ["HolyNimbus", "Aura Damage", ["tokenTurnStart"], "@scale.paladin.aura-of-protection"],
    ["AvengingAngel", "Avenging Angel", ["tokenEnter"], "30"],
    ["Plaguebringer", "Entropic Radiance Damage", ["tokenTurnStart"], "@scale.paladin.aura-of-protection"],
    ["ApocalypticRevelation", "Blinding Glory", ["tokenTurnStart"], "5"],
    ["SpiritOfTheValkyrie", "Thunderstruck", ["tokenTurnStart"], "@scale.paladin.aura-of-protection"],
  ])("%s places an enemy emanation firing %s", (name, activityName, events, radius) => {
    const e = build((ClassEnrichers.Paladin as any)[name]);
    const aura = e.additionalActivities.find((a: any) => a.init?.name === "Place Aura");
    expect(aura.build.targetOverride.template.size).toBe(radius);
    expect(aura.build.targetOverride.affects.type).toBe("enemy");
    const [behavior] = aura.overrides.data.behaviors;
    expect(behavior.config.events).toEqual(events);
    expect(behavior.config.args.activityName).toBe(activityName);
  });
});

describe("paladin aura marker regions", () => {
  it("Aura of Conquest marks enemies and fires its damage at their turn start", () => {
    const e = build(ClassEnrichers.Paladin.AuraOfConquest);
    const aura = e.additionalActivities.find((a: any) => a.init?.name === "Place Aura");
    expect(aura.build.targetOverride.template.size).toBe("@scale.conquest.aura-of-conquest");
    const [apply, macro] = aura.overrides.data.behaviors;
    expect(apply.config.effects).toEqual(["Aura of Conquest"]);
    expect(macro.config.events).toEqual(["tokenTurnStart"]);
    expect(macro.config.args.activityName).toBe("Damage");
    expect(e.effects.find((h: any) => h.standalone).auraeffectsNever).toBe(true);
    expect(e.effects.find((h: any) => h.auraeffects).auraeffectsOnly).toBe(true);
  });

  it("Aura of the Guardian marks creatures in range with the reaction reminder", () => {
    const e = build(ClassEnrichers.Paladin.AuraOfTheGuardian);
    expect(e.activity.name).toBe("Place Aura");
    expect(e.activity.data.target.template.size).toBe("@scale.redemption.aura-of-the-guardian");
    const [apply] = e.activity.data.behaviors;
    expect(apply.config.effects).toEqual(["Aura of the Guardian"]);
    expect(e.effects.find((h: any) => h.standalone).auraeffectsNever).toBe(true);
    expect(e.effects.find((h: any) => h.auraeffects).auraeffectsOnly).toBe(true);
  });
});

describe("native teleport class activities", () => {
  it("converts both Travel along the Tree modes without changing their costs", () => {
    const e = build(ClassEnrichers.Barbarian.TravelAlongTheTree);
    expect(e.type).toBe("teleport");
    expect(e.activity.activationType).toBe("bonus");
    expect(e.activity.data).toMatchObject({
      name: "Teleport 60 ft",
      range: { override: true, value: "60", units: "ft" },
      target: { override: true, prompt: false, affects: { count: "1", type: "self" } },
    });
    const [group] = e.additionalActivities;
    expect(group.init).toEqual({ name: "Group Teleport", type: "teleport" });
    expect(group.build).toMatchObject({
      generateConsumption: true,
      rangeOverride: { value: "150", units: "ft" },
      targetOverride: { prompt: false, affects: { count: "7", type: "willing" } },
      activationOverride: { type: "bonus" },
    });
  });

  it("keeps Hunt the Prey's mark on the consuming primary and makes teleport free", () => {
    const e = build(ClassEnrichers.Paladin.HuntThePrey);
    expect(e.activity).toMatchObject({
      name: "Hunt the Prey",
      type: "utility",
      addItemConsume: true,
      itemConsumeTargetName: "Channel Divinity",
    });
    expect(e.effects[0].activityMatch).toBe("Hunt the Prey");
    const [teleport] = e.additionalActivities;
    expect(teleport.init).toEqual({ name: "Teleport to Prey", type: "teleport" });
    expect(teleport.build).toMatchObject({
      generateConsumption: false,
      rangeOverride: { value: "60", units: "ft" },
      activationOverride: { type: "bonus" },
      targetOverride: { prompt: false, affects: { count: "1", type: "self" } },
    });
    expect(teleport.overrides).toMatchObject({ noConsumeTargets: true });
  });
});

describe("barbarian DangerSense", () => {
  /**
   * Was AC5e only. The dnd5e 6.0 rule change carries the same predicate in a condition the
   * system evaluates against the save being rolled, so it works with no modules installed.
   */
  it("gates the 2024 wording on the Incapacitated condition alone", () => {
    const effects = build(ClassEnrichers.Barbarian.DangerSense, { is2014: false }).effects;
    expect(effects[0].ac5eChanges).toBeUndefined();
    expect(effects[0].changes).toEqual([
      expect.objectContaining({ key: "save", value: "1", type: "dnd5e.advantage" }),
    ]);
    expect(JSON.parse(effects[0].changes[0].conditions)).toEqual([
      { k: "roll.ability", v: "dex" },
      { o: "NOT", v: { k: "statuses.incapacitated", o: "gte", v: 1 } },
    ]);
  });

  it("adds Blinded and Deafened for the 2014 wording", () => {
    const effects = build(ClassEnrichers.Barbarian.DangerSense, { is2014: true }).effects;
    const conditions = JSON.parse(effects[0].changes[0].conditions);
    expect(conditions.map((c: any) => c.v?.k ?? c.k)).toEqual([
      "roll.ability", "statuses.blinded", "statuses.deafened", "statuses.incapacitated",
    ]);
    // "against effects that you can see" has no expression in the roll data
    expect(effects[0].options.description).toContain("not checked");
  });
});

describe("region-behavior class features (2026-09-02 wave)", () => {
  function macros(activity: any): any[] {
    return (activity?.data?.behaviors ?? []).filter((b: any) => b.type === "ddbMacro");
  }

  it("sorcerer DraconicPresence: an awe and a fear cast, each firing its own save on hostile turn start", () => {
    const e = build(ClassEnrichers.Sorcerer.DraconicPresence);
    expect(e.type).toBe("utility");
    expect(e.clearAutoEffects).toBe(true);
    expect(e.activity).toMatchObject({
      name: "Draconic Presence: Awe",
      targetType: "enemy",
      itemConsumeTargetName: "Sorcery Points",
      itemConsumeValue: "5",
    });
    expect(e.activity.data.target.template).toMatchObject({ type: "radius", size: "60" });
    expect(macros(e.activity)[0].config).toMatchObject({ events: ["tokenTurnStart"], excludeSelf: true, args: { activityName: "Awe Save" } });

    const [fear, aweSave, fearSave] = e.additionalActivities;
    expect(fear).toMatchObject({ duplicate: true, id: "ddbDracPresFear1" });
    expect(fear.overrides.name).toBe("Draconic Presence: Fear");
    expect(macros(fear.overrides)[0].config.args.activityName).toBe("Fear Save");
    expect(aweSave.init).toEqual({ name: "Awe Save", type: "save" });
    expect(fearSave.init).toEqual({ name: "Fear Save", type: "save" });
    expect(aweSave.build.saveOverride.ability).toEqual(["wis"]);
    expect(e.effects.map((f: any) => [f.activityMatch, f.statuses])).toEqual([
      ["Awe Save", ["Charmed"]],
      ["Fear Save", ["Frightened"]],
    ]);
  });

  it("druid HaloOfSpores: Place Halo offers the parsed reaction on move-in and turn start", () => {
    const e = build(ClassEnrichers.Druid.HaloOfSpores);
    expect(e.activity.name).toBe("Halo of Spores");
    const [halo] = e.additionalActivities;
    expect(halo.init).toEqual({ name: "Place Halo", type: "utility" });
    expect(halo.build.targetOverride.template).toMatchObject({ type: "radius", size: "10" });
    expect(macros(halo.overrides)[0].config).toMatchObject({
      events: ["tokenEnter", "tokenMoveIn", "tokenTurnStart"],
      excludeSelf: true,
      args: { activityName: "Halo of Spores" },
    });
  });

  it("fighter StoneRune: the feature gains a 30-foot Rune Aura offering Invoke Rune at turn end", () => {
    const e = build(ClassEnrichers.Fighter.StoneRune, { isAction: false });
    const aura = e.additionalActivities.find((a: any) => a.init?.name === "Rune Aura");
    expect(aura.build.targetOverride.template).toMatchObject({ type: "radius", size: "30" });
    expect(macros(aura.overrides)[0].config).toMatchObject({ events: ["tokenTurnEnd"], excludeSelf: true, args: { activityName: "Invoke Rune" } });
    // the action document is the roll itself and gets no aura
    expect(build(ClassEnrichers.Fighter.StoneRune, { isAction: true }).additionalActivities).toEqual([]);
  });

  it("barbarian BranchesOfTheTree: a named save plus a 30-foot aura firing it on turn start", () => {
    const e = build(ClassEnrichers.Barbarian.BranchesOfTheTree);
    expect(e.activity.name).toBe("Branches of the Tree");
    const [aura] = e.additionalActivities;
    expect(aura.init.name).toBe("Branches Aura");
    expect(macros(aura.overrides)[0].config).toMatchObject({ events: ["tokenTurnStart"], excludeSelf: true, args: { activityName: "Branches of the Tree" } });
  });

  it("sorcerer SpiritAura: one cast carrying an enemy save arm and an ally buff arm", () => {
    const e = build(ClassEnrichers.Sorcerer.SpiritAura);
    expect(e.type).toBe("utility");
    expect(e.activity).toMatchObject({ name: "Spirit Aura", activationType: "bonus", addItemConsume: true });
    expect(macros(e.activity).map((b: any) => b.config.args.activityName)).toEqual(["Maddening Whispers", "Bolstering Whispers"]);
    const [maddening, bolstering, restore] = e.additionalActivities;
    expect(maddening.init).toEqual({ name: "Maddening Whispers", type: "save" });
    expect(maddening.build.targetOverride.affects.type).toBe("enemy");
    expect(bolstering.init).toEqual({ name: "Bolstering Whispers", type: "utility" });
    expect(bolstering.build.targetOverride.affects.type).toBe("ally");
    expect(restore.init.name).toBe("Spend Sorcery Points to Restore Use");
    // native rule changes replace the midi flags; both riders end on the target's next turn end
    const [madEffect, bolEffect] = e.effects;
    expect(madEffect.options.expiry).toBe("targetEnd");
    expect(madEffect.changes.map((c: any) => [c.key, c.type, c.value])).toEqual([["attack", "dnd5e.advantage", "-1"], ["check", "dnd5e.advantage", "-1"]]);
    expect(bolEffect.changes.map((c: any) => [c.key, c.type, c.value])).toEqual([["attack", "dnd5e.advantage", "1"], ["check", "dnd5e.advantage", "1"]]);
    expect(madEffect.midiChanges).toBeUndefined();
  });

  it("ranger Trapper traps: the Miasma create/trigger split for Snapfrost and Gravity Well, a one-shot square for Bear Trap", () => {
    const trigger = (e: any) => e.additionalActivities.find((a: any) => a.init?.name === "Trigger Magical Trap");
    const pulled = (e: any) => e.additionalActivities.filter((a: any) => a.action).map((a: any) => a.action.name);

    const snap = build(ClassEnrichers.Ranger.SetTrapSnapfrost);
    expect(snap.type).toBe("utility");
    expect(snap.activity).toMatchObject({ name: "Create Magical Trap", addItemConsume: true });
    // the trigger fires the trap's class action by name, so that action is pulled onto the document
    expect(pulled(snap)).toEqual(["Activate Snapfrost"]);
    const snapTrigger = trigger(snap);
    expect(snapTrigger.build.targetOverride.template).toMatchObject({ type: "radius", size: "20" });
    expect(macros(snapTrigger.overrides)[0].config).toMatchObject({ events: ["tokenEnter", "tokenTurnStart"], args: { activityName: "Activate Snapfrost" } });

    const well = build(ClassEnrichers.Ranger.SetTrapGravityWell);
    expect(pulled(well)).toEqual(["Activate Gravity Well", "Gravity Well: Damage", "Gravity Well: Critical Mass"]);
    const wellTrigger = trigger(well);
    expect(wellTrigger.build.targetOverride.template).toMatchObject({ type: "radius", size: "30" });
    expect(wellTrigger.overrides.data.duration).toMatchObject({ value: "1", units: "round" });
    expect(wellTrigger.overrides.data.behaviors.map((b: any) => b.type)).toEqual(["difficultTerrain", "ddbMacro"]);
    expect(macros(wellTrigger.overrides)[0].config).toMatchObject({ events: ["tokenTurnStart"], args: { activityName: "Gravity Well: Damage" } });

    const bear = build(ClassEnrichers.Ranger.SetTrapBearTrap);
    expect(bear.activity.name).toBe("Deploy Bear Trap");
    expect(pulled(bear)).toEqual(["Bear Trap: Damage"]);
    expect(bear.activity.data.target.template).toMatchObject({ type: "square", size: "5" });
    expect(macros(bear.activity)[0].config).toMatchObject({
      events: ["tokenEnter", "tokenMoveIn"],
      sizes: ["tiny", "sm", "med", "lg"],
      args: { activityName: "Bear Trap: Damage" },
    });
  });

  it("sorcerer CreateIce: five contiguous squares of ice difficult terrain for a round", () => {
    const e = build(ClassEnrichers.Sorcerer.CreateIce);
    expect(e.type).toBe("utility");
    expect(e.activity.data.target.template).toMatchObject({ type: "square", size: "5", count: "5", contiguous: true });
    expect(e.activity.data.duration).toMatchObject({ value: "1", units: "round" });
    expect(e.activity.data.behaviors).toEqual([expect.objectContaining({ type: "difficultTerrain", config: { types: ["ice"] } })]);
    expect(e.additionalActivities.map((a: any) => a.action?.name)).toEqual(["Create Ice: Freeze"]);
  });
});
