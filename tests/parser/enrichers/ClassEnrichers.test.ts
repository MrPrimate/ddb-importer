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

describe("bard BardicInspiration", () => {
  const Enricher = ClassEnrichers.Bard.BardicInspiration;

  it("refills to two on initiative from Bard 18 in 2024 only", () => {
    expect(build(Enricher, { is2014: true }).additionalActivities).toEqual([]);
    const [regain] = build(Enricher).additionalActivities;
    expect(regain.init).toMatchObject({ name: "Regain Inspiration", type: "utility" });
    expect(regain.build.activationOverride.type).toBe("encounter");
    expect(regain.build.noeffect).toBe(true);
    expect(regain.overrides).toMatchObject({ addItemConsume: true, itemConsumeValue: "min(0, @item.uses.value - 2)",
      data: { visibility: { level: { min: 18, max: null } } } });
  });
});

describe("bard SuperiorInspiration", () => {
  const Enricher = ClassEnrichers.Bard.SuperiorInspiration;

  it("regains one use on initiative in 2014 and carries no activity in 2024", () => {
    const legacy = build(Enricher, { is2014: true });
    expect(legacy.type).toBe("utility");
    expect(legacy.stopDefaultActivity).toBe(false);
    expect(legacy.activity).toMatchObject({ itemConsumeValue: "-1", activationType: "encounter" });
    const modern = build(Enricher);
    expect(modern.type).toBeNull();
    expect(modern.stopDefaultActivity).toBe(true);
    expect(modern.activity).toBeNull();
    expect(legacy.override).toBeNull();
    expect(modern.override.descriptionSuffix).toContain("Regain Inspiration activity on Bardic Inspiration");
  });
});

/**
 * Features build hints-only, so an enricher that only declares `type` used to produce no activity
 * at all and silently dropped the DDB action the Generic fallback had matched (War Priest lost its
 * bonus attack). The guard in DDBFeatureMixin now treats a bare `type` as a request; these pin
 * the explicit activities the two cleric enrichers grew when that was found.
 */
describe("cleric WarPriest and WarGodsBlessing", () => {
  it("gives War Priest a self-targeted bonus action on its own Wisdom pool", () => {
    const e = build(ClassEnrichers.Cleric.WarPriest);
    expect(e.type).toBe("utility");
    expect(e.activity).toMatchObject({ name: "Bonus Attack", activationType: "bonus", targetType: "self" });
    expect(e.override.uses).toMatchObject({ max: "max(1, @abilities.wis.mod)" });
    expect(e.override.uses.recovery).toEqual([{ period: "sr", type: "recoverAll", formula: undefined }]);
  });

  it("shapes War God's Blessing as a 2014 reaction with no extra activities", () => {
    const e = build(ClassEnrichers.Cleric.WarGodsBlessing, { is2014: true });
    expect(e.type).toBe("utility");
    expect(e.activity).toMatchObject({ activationType: "reaction", targetType: "creature" });
    expect(e.additionalActivities).toEqual([]);
  });

  it("casts Shield of Faith and Spiritual Weapon off Channel Divinity without Concentration in 2024", () => {
    const e = build(ClassEnrichers.Cleric.WarGodsBlessing);
    expect(e.type).toBe("cast");
    const expected = {
      noSpellslot: true,
      addItemConsume: true,
      itemConsumeTargetName: "Channel Divinity",
      data: {
        duration: { value: "1", units: "minute", concentration: false, override: true },
        spell: { properties: ["concentration"], spellbook: true },
      },
    };
    expect(e.activity).toMatchObject({ name: "Cast Shield of Faith", addSpellUuid: "Shield of Faith", ...expected });
    expect(e.additionalActivities).toHaveLength(1);
    expect(e.additionalActivities[0]).toMatchObject({
      init: { name: "Cast Spiritual Weapon", type: "cast" },
      build: { generateSpell: true, generateConsumption: false },
      overrides: { name: "Cast Spiritual Weapon", addSpellUuid: "Spiritual Weapon", ...expected },
    });
  });
});

describe("warlock class features", () => {
  const W = ClassEnrichers.Warlock;

  it("gates Magical Cunning's half and full rites on Warlock 20", () => {
    const e = build(W.MagicalCunning);
    expect(e.activity).toMatchObject({ name: "Perform Esoteric Rite", activationType: "minute" });
    expect(e.activity.data.visibility.level).toEqual({ min: null, max: 19 });
    expect(e.activity.additionalConsumptionTargets[0].value).toBe("-(ceil(@spells.pact.max / 2))");
    const [master] = e.additionalActivities;
    expect(master.init.name).toBe("Perform Master Rite");
    expect(master.overrides).toMatchObject({ addItemConsume: true, data: { visibility: { level: { min: 20, max: null } } } });
    expect(master.overrides.additionalConsumptionTargets[0].value).toBe("-@spells.pact.max");
  });

  it("leaves 2024 Eldritch Master to Magical Cunning and keeps the 2014 rite", () => {
    expect(build(W.EldritchMaster).type).toBe("none");
    expect(build(W.EldritchMaster).activity).toBeNull();
    const e14 = build(W.EldritchMaster, { is2014: true });
    expect(e14.type).toBe("utility");
    expect(e14.activity.activationType).toBe("minute");
  });

  it("triggers Dark One's Blessing on a kill instead of as an action", () => {
    expect(build(W.DarkOnesBlessing).activity.activationType).toBe("special");
  });

  it("rolls Dark One's Own Luck from a utility with Charisma (min 1) uses per Long Rest", () => {
    const e = build(W.DarkOnesOwnLuck);
    expect(e.type).toBe("utility");
    expect(e.activity.data.roll.formula).toBe("1d10");
    expect(e.override.uses).toMatchObject({ max: "max(1, @abilities.cha.mod)", recovery: [{ period: "lr", type: "recoverAll" }] });
    expect(build(W.DarkOnesOwnLuck, { is2014: true }).type).toBeNull();
  });

  it("deals Hurl Through Hell's psychic damage and ends it at the end of the warlock's next turn", () => {
    const e = build(W.HurlThroughHell);
    expect(e.type).toBe("save");
    expect(e.activity.data.damage.onSave).toBe("none");
    expect(e.activity.data.damage.parts[0]).toMatchObject({ number: 8, denomination: 10, types: ["psychic"] });
    expect(e.effects[0].options.expiry).toBe("sourceEnd");
    expect(e.additionalActivities).toHaveLength(1);
    const e14 = build(W.HurlThroughHell, { is2014: true });
    expect(e14.type).toBe("damage");
    expect(e14.activity.data.damage.parts[0]).toMatchObject({ number: 10, denomination: 10 });
    expect(e14.additionalActivities).toEqual([]);
  });

  it("keeps Lifedrinker's extra damage free and gives 2014 its Charisma necrotic damage only", () => {
    const e = build(W.InvocationLifedrinker);
    expect(e.activity.noConsumeTargets).toBe(true);
    expect(e.additionalActivities).toHaveLength(2);
    const e14 = build(W.InvocationLifedrinker, { is2014: true });
    expect(e14.activity.data.damage.parts[0]).toMatchObject({ custom: { formula: "max(1, @abilities.cha.mod)" }, types: ["necrotic"] });
    expect(e14.additionalActivities).toEqual([]);
  });

  it("spends a pact slot on Eldritch Smite and links the Prone effect", () => {
    const e = build(W.EldritchSmite);
    expect(e.type).toBe("damage");
    expect(e.activity.additionalConsumptionTargets).toEqual([{ type: "attribute", value: "1", target: "spells.pact.value" }]);
    expect(e.activity.data.damage.parts[0].custom.formula).toBe("(1 + @spells.pact.level)d8");
    expect(e.effects[0]).toMatchObject({ statuses: ["Prone"], activityMatch: "Smite" });
  });
});

describe("wizard 2024 class features", () => {
  it("recovers Arcane Recovery slots from the Short Rest card", () => {
    expect(build(ClassEnrichers.Wizard.ArcaneRecovery).activity).toMatchObject({ name: "Recover Spell Slots", activationType: "shortRest" });
  });

  it("lists Memorize Spell on the Short Rest card", () => {
    const e = build(ClassEnrichers.Wizard.MemorizeSpell);
    expect(e.type).toBe("utility");
    expect(e.activity).toMatchObject({ name: "Memorize", activationType: "shortRest" });
  });

  it("builds Overchannel with First Use / Second+ Use activities and uses that count up", () => {
    const e = build(ClassEnrichers.Wizard.Overchannel);
    expect(e.type).toBe("utility");
    expect(e.activity).toMatchObject({ name: "First Use", addItemConsume: true, itemConsumeValue: "@item.uses.value - 1" });
    expect(e.override.uses).toMatchObject({ spent: 20, max: "20", recovery: [{ period: "lr", type: "loseAll" }] });
    expect(e.override.retainUseSpent).toBe(true);
  });

  it("rolls Overchannel's dice per spell level from the second use", () => {
    const [second] = build(ClassEnrichers.Wizard.Overchannel).additionalActivities;
    expect(second.init).toEqual({ name: "Second+ Use", type: "damage" });
    expect(second.overrides).toEqual({ addItemConsume: true, itemConsumeValue: "-1", addConsumptionScalingMax: "5" });
    expect(second.build.damageParts[0].custom.formula).toBe("((1 + @item.uses.value) * @scaling)d12");
    expect(second.build.damageParts[0].scaling.mode).toBe("none");
  });

  it("adds an Overchannel macro activity that rolls the spell's maximum damage", () => {
    const [, maximum] = build(ClassEnrichers.Wizard.Overchannel).additionalActivities;
    expect(maximum.init).toEqual({ name: "Calculate Maximum Damage", type: "ddbmacro" });
    expect(maximum.build.generateConsumption).toBe(false);
    expect(maximum.build.ddbMacroOverride.function).toBe("ddb.generic.maximumDamage");
    expect(JSON.parse(maximum.build.ddbMacroOverride.parameters)).toEqual({ title: "Maximum Damage", sources: [{ type: "spell" }] });
  });

  it("keeps the Foundry count for a 2014 Overchannel whatever DDB records", () => {
    const e = build(ClassEnrichers.Wizard.Overchannel, {
      is2014: true,
      actions: { class: [{ name: "Overchannel", limitedUse: { numberUsed: 1 } }] },
    });
    expect(e.override.uses.spent).toBe(20);
    expect(e.override.retainUseSpent).toBe(true);
    expect(e.activity.activationCondition).toContain("1st through 5th level");
  });
});

describe("wizard SculptSpells", () => {
  it("transfers the midi sculpt flag to the actor, since nothing ever activates it", () => {
    const e = build(ClassEnrichers.Wizard.SculptSpells);
    expect(e.activity).toBeNull();
    expect(e.effects).toHaveLength(1);
    expect(e.effects[0].midiOnly).toBe(true);
    expect(e.effects[0].options).toMatchObject({ transfer: true });
    expect(e.effects[0].midiChanges?.map((c: any) => c.key)).toEqual(["flags.midi-qol.sculptSpell"]);
  });
});

describe("druid 2024 class features", () => {
  it("offers lightning on Primal Strike", () => {
    const e = build(ClassEnrichers.Druid.ElementalFuryPrimalStrike);
    expect(e.activity.data.damage.parts[0].types).toEqual(["cold", "fire", "lightning", "thunder"]);
  });

  it("gives Magician's Arcana and Nature bonus a minimum of +1", () => {
    const e = build(ClassEnrichers.Druid.PrimalOrderMagician);
    expect(e.clearAutoEffects).toBe(true);
    expect(e.effects[0].changes.map((c: any) => [c.key, c.value])).toEqual([
      ["system.skills.arc.roll.bonus", "max(1, @abilities.wis.mod)"],
      ["system.skills.nat.roll.bonus", "max(1, @abilities.wis.mod)"],
    ]);
  });

  it("adds Magician's cantrip to cantrips known only on munched copies", () => {
    const munched = build(ClassEnrichers.Druid.PrimalOrderMagician, { ddbParser: { isMuncher: true } });
    expect(munched.effects[0].changes.at(-1)).toMatchObject({ key: "system.scale.druid.cantrips-known.value", value: "1" });
    expect(munched.effects[0].changes).toHaveLength(3);
  });

  it("recovers Natural Recovery slots from the Short Rest card", () => {
    const [recover] = build(ClassEnrichers.Druid.NaturalRecovery).additionalActivities;
    expect(recover.init.name).toBe("Recover Spell Slots");
    expect(recover.build.activationOverride.type).toBe("shortRest");
  });
});

describe("druid WildShape", () => {
  const cr = (e: any) => e.activity.data.profiles[0].cr as string;

  it("scales the CR cap with the WoW Druid's Feral and Guardian Specializations, which reprint the Moon", () => {
    const wow = build(ClassEnrichers.Druid.WildShape, { klass: "Druid", ddbParser: { _class: { definition: { id: 2921846 } } } });
    expect(cr(wow)).toContain("@subclasses.moon.levels / 3");
    expect(cr(wow)).toContain("@subclasses.feral-specialization.levels / 3");
    expect(cr(wow)).toContain("@subclasses.guardian-specialization.levels / 3");
  });

  it("names only the Moon for the core Druid", () => {
    const core = build(ClassEnrichers.Druid.WildShape, { klass: "Druid", ddbParser: { _class: { definition: { id: 2190876 } } } });
    expect(cr(core)).toBe("max(1/4, @subclasses.moon.levels / 3, @subclasses.circle-moon.levels / 3)");
  });
});

describe("fighter SecondWind", () => {
  const Enricher = ClassEnrichers.Fighter.SecondWind;

  it("recovers all on a Long Rest and one on a Short Rest in 2024, once each", () => {
    const data = { system: { uses: { max: "2", recovery: [
      { period: "lr", type: "recoverAll" }, { period: "sr", type: "formula", formula: "1" },
    ] } } };
    expect(build(Enricher, { data }).override.uses.recovery).toEqual([
      { period: "lr", type: "recoverAll" }, { period: "sr", type: "formula", formula: "1" },
    ]);
    const fromReset = { system: { uses: { max: "2", recovery: [{ period: "sr", type: "recoverAll" }] } } };
    expect(build(Enricher, { data: fromReset }).override.uses.recovery).toEqual([
      { period: "lr", type: "recoverAll" }, { period: "sr", type: "formula", formula: "1" },
    ]);
    expect(build(Enricher, { data, is2014: true }).override).toBeNull();
  });
});

describe("fighter Indomitable and TacticalMind", () => {
  it("rerolls a failed save as a special activation, adding the Fighter level in 2024", () => {
    const modern = build(ClassEnrichers.Fighter.Indomitable).activity;
    expect(modern).toMatchObject({ name: "Reroll", activationType: "special",
      activationCondition: "When you fail a saving throw", data: { roll: { formula: "@classes.fighter.levels" } } });
    const legacy = build(ClassEnrichers.Fighter.Indomitable, { is2014: true }).activity;
    expect(legacy.activationType).toBe("special");
    expect(legacy.data.roll).toBeUndefined();
  });

  it("adds the Tactical Mind bonus when an ability check fails", () => {
    expect(build(ClassEnrichers.Fighter.TacticalMind).activity).toMatchObject({ name: "Add Bonus",
      activationType: "special", activationCondition: "When you fail an ability check", data: { roll: { formula: "1d10" } } });
  });
});

describe("rogue Cunning Strike and Devious Strikes durations", () => {
  const duration = (a: any) => a.build.durationOverride;

  it("lasts a minute only where the rules say so", () => {
    const cunning = build(ClassEnrichers.Rogue.CunningStrike);
    expect(cunning.activity.data.duration).toEqual({ value: "1", units: "minute" });
    for (const a of cunning.additionalActivities) expect(duration(a)).toEqual({ value: "", units: "inst" });
    expect(cunning.effects.find((e: any) => e.name === "Prone").options.durationSeconds).toBeNull();

    const devious = build(ClassEnrichers.Rogue.DeviousStrikes);
    const byName = Object.fromEntries(devious.additionalActivities.map((a: any) => [a.init.name, a]));
    expect(duration(byName["Obscure"])).toEqual({ value: "", units: "inst" });
    expect(byName["Modified Sneak Attack Damage"]).toBeUndefined();
    expect(cunning.additionalActivities.map((a: any) => a.init.name)).not.toContain("Modified Sneak Attack Damage");
  });

  it("ends Dazed and Blinded at the end of the target's next turn", () => {
    const effects = build(ClassEnrichers.Rogue.DeviousStrikes).effects;
    for (const [name, activity] of [["Dazed", "Daze"], ["Blinded", "Obscure"]]) {
      const effect = effects.find((e: any) => e.name === name);
      expect(effect.activityMatch).toBe(activity);
      expect(effect.options.expiry).toBe("targetEnd");
    }
  });
});

describe("rogue Cunning Sneak Attack", () => {
  it("lives on 2024 Sneak Attack from Rogue 5 and spends its use", () => {
    const [cunning] = build(ClassEnrichers.Rogue.SneakAttack).additionalActivities;
    expect(cunning.init).toMatchObject({ name: "Cunning Sneak Attack", type: "damage" });
    expect(cunning.build.durationOverride).toEqual({ value: "", units: "inst" });
    expect(cunning.build.damageParts[0].custom.formula).toBe("(@scale.rogue.sneak-attack.number - @scaling)d6");
    expect(cunning.overrides).toMatchObject({
      addItemConsume: true,
      addConsumptionScalingMax: "@scale.rogue.sneak-attack.number",
      data: { visibility: { identifier: "rogue", level: { min: 5, max: null } } },
    });
  });

  it("is absent for 2014 and for other classes' Sneak Attack", () => {
    expect(build(ClassEnrichers.Rogue.SneakAttack, { is2014: true }).additionalActivities).toEqual([]);
    expect(build(ClassEnrichers.Messenger.SneakAttack).additionalActivities).toEqual([]);
  });
});

describe("rogue UseMagicDeviceScroll", () => {
  it("sets the check DC to 10 plus the scaled spell level", () => {
    const enricher = build(ClassEnrichers.Rogue.UseMagicDeviceScroll);
    expect(enricher.activity.data.check.dc).toEqual({ calculation: "", formula: "10 + @scaling" });
    expect(enricher.activity.addConsumptionScalingMax).toBe("9");
  });
});

describe("heals equal to damage dealt", () => {
  it("Blood Runic Power heals an entered amount, not a fresh roll", () => {
    const e = named(ClassEnrichers.Paladin.RunicPower, "Runic Power: Blood");
    const [blood] = e.additionalActivities;
    expect(blood.init.name).toBe("Runic Power: Blood");
    expect(blood.build.healingPart).toMatchObject({ custom: { enabled: true, formula: "0" } });
    expect(blood.build.healingPart.number ?? null).toBeNull();
    expect(blood.build.activationOverride.condition).toMatch(/situational bonus/);
  });

  it("Devouring Plague heals an entered amount, not a separate 1d10", () => {
    const heal = build(ClassEnrichers.Cleric.DevouringPlague).additionalActivities[0];
    expect(heal.build.healingPart).toMatchObject({ custom: { enabled: true, formula: "0" } });
    expect(heal.build.activationOverride.condition).toMatch(/situational bonus/);
  });
});
