/**
 * Class enricher hints for the conditional paths the audit captures cannot reach on their own
 * (ruleset, class on the character, chosen option). These assert the hints a DDBFeature
 * consumes, not the built document.
 *
 * The full enricher barrel is the first src import, as in tests/smoke/enricherFirstLoad.test.ts:
 * loading a factory such as DDBClassFeatureEnricher before the barrel re-enters the enricher
 * tree mid-evaluation.
 */
import * as Enrichers from "../../../src/parser/enrichers/_module";
import { makeEnricherData } from "../../_fixtures/ddb/factories";
import { installActivityConfigStubs } from "../../_fixtures/ddb/stubs";

beforeAll(() => {
  installActivityConfigStubs();
});

const ClassEnrichers = Enrichers.ClassEnrichers;

type TEnricher = new (options: any) => any;

function build(Enricher: TEnricher, options: Parameters<typeof makeEnricherData>[1] = {}): any {
  return makeEnricherData(Enricher, options);
}

/** Most branches key off ddbParser.originalName rather than the enricher's own name. */
function named(Enricher: TEnricher, originalName: string, options: Record<string, any> = {}): any {
  return build(Enricher, { name: originalName, ddbParser: { originalName }, ...options });
}

describe("paladin AuraOfAlacrity", () => {
  const alacrity = (is2014: boolean) => build(ClassEnrichers.Paladin.AuraOfAlacrity, {
    name: "Aura of Alacrity",
    is2014,
    klass: "Paladin",
    ddbParser: { originalName: "Aura of Alacrity" },
    data: { name: "Aura of Alacrity", flags: {}, system: { description: { value: "" } } },
  });

  it("resolves its own enricher, not the generic paladin aura", () => {
    const factory = new Enrichers.DDBClassFeatureEnricher({ activityGenerator: null });
    expect(factory.ENRICHERS["Aura of Alacrity"]).toBe(ClassEnrichers.Paladin.AuraOfAlacrity);
  });

  it("reaches allies in the Aura of Protection in 2024, and 5 then 10 feet in 2014", () => {
    const [modern] = alacrity(false).effects;
    expect(modern.auraeffects.distanceFormula).toBe("@scale.paladin.aura-of-protection");
    const [legacy] = alacrity(true).effects;
    const legacySize = "min(10, 5 + (5 * floor(@classes.paladin.levels / 18)))";
    expect(legacy.auraeffects.distanceFormula).toBe(legacySize);
    expect(legacy.data.flags.ActiveAuras.radius).toBe(legacySize);
    // the paladin's own +10 comes from DDB's speed modifier, so the aura skips them
    expect(legacy.auraeffects.applyToSelf).toBe(false);
    expect(legacy.data.flags.ActiveAuras.ignoreSelf).toBe(true);
  });
});

describe("single save definitions", () => {
  it.each([
    ["TakeGhastlyForm"],
    ["WrathOfTheWild"],
  ])("%s builds its Unnerving Aura as one Wisdom save against the spell save DC", (name) => {
    const aura = build((ClassEnrichers.Ranger as any)[name]).additionalActivities.find((a: any) => a.init?.name === "Unnerving Aura");
    expect(aura.build.saveOverride).toEqual({ ability: ["wis"], dc: { calculation: "spellcasting", formula: "" } });
    expect(aura.overrides.data.save).toBeUndefined();
  });
});

describe("warlock InvocationPactOfTheBlade", () => {
  it("leaves the weapon's attack ability alone; Charisma is the rider's option", () => {
    const [pactWeapon] = build(ClassEnrichers.Warlock.InvocationPactOfTheBlade).effects;
    expect(pactWeapon.changes.some((change: any) => change.key.includes("ability"))).toBe(false);
    expect(pactWeapon.data.flags.ddbimporter.activityRiders).toEqual([ClassEnrichers.Warlock.InvocationPactOfTheBlade.ATTACK_ID]);
  });
});

describe("barbarian Rage", () => {
  it("marks the raging actor with AC5e's raging status, which weapon rule conditions test", () => {
    const [rage] = build(ClassEnrichers.Barbarian.Rage).effects;
    expect(rage.data.statuses).toEqual(["raging"]);
  });
});

// Paladin Blessed Warrior and Ranger Druidic Warrior: Fighting Style feats granting two cantrips
describe("Fighting Style cantrip options", () => {
  it("are Fighting Style feats under their own name, as in the PHB", () => {
    const e = named(ClassEnrichers.Paladin.BlessedWarrior, "Fighting Style: Blessed Warrior");
    expect(e.override.data).toMatchObject({
      name: "Blessed Warrior",
      system: { type: { value: "class", subtype: "fightingStyle" }, requirements: "Paladin" },
    });
  });

  it("carry a two-cantrip choice from the class list on a munch only", () => {
    const munched = named(ClassEnrichers.Ranger.DruidicWarrior, "Fighting Style: Druidic Warrior", { ddbParser: { originalName: "Fighting Style: Druidic Warrior", isMuncher: true } });
    const [advancement] = munched.additionalAdvancements;
    expect(advancement.type).toBe("ItemChoice");
    expect(advancement.configuration).toMatchObject({
      choices: { 0: { count: 2, replacement: false } },
      restriction: { level: "0", list: ["class:druid"] },
      type: "spell",
      spell: { ability: ["wis"], method: "spell", prepared: 2 },
    });
    // DDB already adds a character's chosen cantrips to the spellbook
    expect(named(ClassEnrichers.Ranger.DruidicWarrior, "Fighting Style: Druidic Warrior").additionalAdvancements).toEqual([]);
    // the 2014 (Tasha's) printing already gets a cantrip choice from DDB's own spell choice
    expect(named(ClassEnrichers.Ranger.DruidicWarrior, "Fighting Style: Druidic Warrior", { is2014: true, ddbParser: { originalName: "Fighting Style: Druidic Warrior", isMuncher: true } }).additionalAdvancements).toEqual([]);
  });
});

describe("fighter Blade Breaker maneuver save DC", () => {
  const maneuver = "Blade Breaker Maneuvers: Disarming Swipe";
  const dcFor = (options: Record<string, any> = {}) =>
    named(ClassEnrichers.Fighter._BladeBreakerManeuver, maneuver, options).activity.data.save.dc.formula;
  const choosing = (ability: string) => ({ character: { options: { class: [{ definition: { name: `Martial Maneuvers: ${ability}` } }], race: [], feat: [] } } });

  it("follows the ability the fighter chose for Martial Maneuvers", () => {
    expect(dcFor(choosing("Strength"))).toBe("8 + @prof + @abilities.str.mod");
    expect(dcFor(choosing("Dexterity"))).toBe("8 + @prof + @abilities.dex.mod");
  });

  it("takes the higher of the two without a choice, and leaves the shared table alone", () => {
    expect(dcFor()).toBe("8 + @prof + max(@abilities.str.mod, @abilities.dex.mod)");
    dcFor(choosing("Dexterity"));
    expect(dcFor()).toBe("8 + @prof + max(@abilities.str.mod, @abilities.dex.mod)");
  });
});

describe("official export review third pass: small shape corrections", () => {
  it("barbarian IntimidatingPresence is a save whose Frightened is a native status effect", () => {
    const e = build(ClassEnrichers.Barbarian.IntimidatingPresence);
    expect(e.type).toBe("save");
    expect(e.activity.data.save).toMatchObject({ ability: ["wis"], dc: { calculation: "str" } });
    const [frightened] = e.effects;
    expect(frightened).toMatchObject({ activityMatch: "Save", statuses: ["Frightened"] });
    expect(frightened.noCreate).toBeUndefined();
    expect(frightened.midiOnly).toBeUndefined();
    expect(e.override.ignoredConsumptionActivities).toEqual(["Save"]);
  });

  it.each([false, true])("rogue RendMind is a Wisdom save against 8 + Dex + proficiency (2014: %s)", (is2014) => {
    const e = build(ClassEnrichers.Rogue.RendMind, { is2014 });
    expect(e.type).toBe("save");
    expect(e.activity).toMatchObject({
      addItemConsume: true,
      targetType: "creature",
      data: { save: { ability: ["wis"], dc: { calculation: "dex", formula: "" } } },
    });
    // the die-spending restore utility must not offer the Stunned effect
    const [restore] = e.additionalActivities;
    expect(restore.init.name).toBe("Spend Psionic Energy Die to Restore Use");
    expect(restore.build.noeffect).toBe(true);
  });

  it("monk ElementalBurst is a Magic action Dexterity save at 120 feet with half damage on a success", () => {
    const e = build(ClassEnrichers.Monk.ElementalBurst);
    expect(e.type).toBe("save");
    expect(e.activity).toMatchObject({
      activationType: "action",
      targetType: "creature",
      data: {
        range: { value: "120", units: "ft" },
        save: { ability: ["dex"], dc: { calculation: "wis" } },
        damage: { onSave: "half" },
      },
    });
    expect(e.activity.data.damage.parts[0].custom.formula).toBe("@scale.elements.elemental-burst");
  });

  it("monk DeflectAttackRedirectAttack's save DC is the monk's Wisdom", () => {
    const e = build(ClassEnrichers.Monk.DeflectAttackRedirectAttack);
    expect(e.activity.data.save).toEqual({ ability: ["dex"], dc: { calculation: "wis", formula: "" } });
  });

  it("monk HandOfUltimateMercy heals 4d10 plus Wisdom rather than Wisdom alone", () => {
    const healing = build(ClassEnrichers.Monk.HandOfUltimateMercy).activity.data.healing;
    expect(healing).toMatchObject({ number: 4, denomination: 10, bonus: "@abilities.wis.mod", types: ["healing"] });
    expect(healing.custom.enabled).toBe(false);
  });

  it("artificer AdvancedArtifice restores a Flash of Genius use in 2024 and builds nothing in 2014", () => {
    const modern = build(ClassEnrichers.Artificer.AdvancedArtifice);
    expect(modern.type).toBe("utility");
    expect(modern.activity).toMatchObject({ addItemConsume: true, itemConsumeTargetName: "Flash of Genius", itemConsumeValue: "-1" });
    expect(modern.activity.activityConsumeValue).toBeUndefined();
    expect(build(ClassEnrichers.Artificer.AdvancedArtifice, { is2014: true }).activity).toBeNull();
  });

  it("druid Wildfire Spirit and Wild Companion keep the Wild Shape link off their free activities", () => {
    expect(build(ClassEnrichers.Druid.SummonWildfireSpirit).override.ignoredConsumptionActivities)
      .toEqual(["Wildfire Summoning Damage", "Command Spirit"]);
    expect(build(ClassEnrichers.Druid.WildCompanion).override.ignoredConsumptionActivities)
      .toEqual(["Summon with Spell Slot"]);
    expect(build(ClassEnrichers.Druid.WildCompanion, { is2014: true }).override).toBeNull();
  });
});
