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
import { makeEnricherData } from "../../_fixtures/ddb/factories";

beforeAll(async () => {
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
