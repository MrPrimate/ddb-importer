/**
 * Region-behavior pins for the partner-content spell enrichers built on spell/_SpellRegions. The
 * spells audit shows what each document ends up with, but a behavior naming a sibling activity by
 * `activityName` and an effect matched to an activity by name are links it cannot see, so both are
 * asserted here for every enricher, then each distinct shape once.
 *
 * No vi.mock preamble, for the reasons given in ClassEnrichers.test.ts. The save, dice and upcast
 * scaling of a built "Ongoing Save" come from the spell parser at build time, not from these
 * classes, so they are the audit's to check, not this file's.
 */
import * as SpellEnrichers from "../../../src/parser/enrichers/spell/_module";
import SRDEffects from "../../../src/parser/enrichers/effects/SRDEffects";
import { ONGOING, area, castPlacer, emanation, ongoingClone, ongoingTrigger } from "../../../src/parser/enrichers/spell/_SpellRegions";
import { makeEnricherData } from "../../_fixtures/ddb/factories";
import { installActivityConfigStubs } from "../../_fixtures/ddb/stubs";

beforeAll(() => {
  installActivityConfigStubs();
});

type TEnricher = new (options: any) => any;

const REGION_SPELLS: [string, TEnricher][] = [
  ["AcidRain", SpellEnrichers.AcidRain],
  ["ArcanomagneticStorm", SpellEnrichers.ArcanomagneticStorm],
  ["AuraOfDesecration", SpellEnrichers.AuraOfDesecration],
  ["AuraOfImpurity", SpellEnrichers.AuraOfImpurity],
  ["Bearstormer", SpellEnrichers.Bearstormer],
  ["Biohazard", SpellEnrichers.Biohazard],
  ["BitterWind", SpellEnrichers.BitterWind],
  ["BlackRibbons", SpellEnrichers.BlackRibbons],
  ["BlindingRadiance", SpellEnrichers.BlindingRadiance],
  ["ButterflyStorm", SpellEnrichers.ButterflyStorm],
  ["ChainsOfBeleth", SpellEnrichers.ChainsOfBeleth],
  ["ConjurePlants", SpellEnrichers.ConjurePlants],
  ["ConjureTheDeepHaze", SpellEnrichers.ConjureTheDeepHaze],
  ["CreateMistOfRlyeh", SpellEnrichers.CreateMistOfRlyeh],
  ["CrookedWard", SpellEnrichers.CrookedWard],
  ["CrownOfRadiance", SpellEnrichers.CrownOfRadiance],
  ["Dirge", SpellEnrichers.Dirge],
  ["DustOfSuleiman", SpellEnrichers.DustOfSuleiman],
  ["EbonTide", SpellEnrichers.EbonTide],
  ["EncaseInIce", SpellEnrichers.EncaseInIce],
  ["FestivalKing", SpellEnrichers.FestivalKing],
  ["FieldOfReaping", SpellEnrichers.FieldOfReaping],
  ["GlobeOfTwilight", SpellEnrichers.GlobeOfTwilight],
  ["GravitySmash", SpellEnrichers.GravitySmash],
  ["GrimShadows", SpellEnrichers.GrimShadows],
  ["Lifesink", SpellEnrichers.Lifesink],
  ["LivingShadows", SpellEnrichers.LivingShadows],
  ["MelodyOfShelteredRest", SpellEnrichers.MelodyOfShelteredRest],
  ["MistOfMourning", SpellEnrichers.MistOfMourning],
  ["MoldEarth", SpellEnrichers.MoldEarth],
  ["MoteOfHell", SpellEnrichers.MoteOfHell],
  ["OdeToWrath", SpellEnrichers.OdeToWrath],
  ["SearingSun", SpellEnrichers.SearingSun],
  ["ShadowDrain", SpellEnrichers.ShadowDrain],
  ["SpiderSong", SpellEnrichers.SpiderSong],
  ["Stench", SpellEnrichers.Stench],
  ["Tremor", SpellEnrichers.Tremor],
  ["UmbralStorm", SpellEnrichers.UmbralStorm],
  ["VenomousAura", SpellEnrichers.VenomousAura],
  ["WallOfDeath", SpellEnrichers.WallOfDeath],
  ["Whiteout", SpellEnrichers.Whiteout],
  // the tail: attacks offered by a region, and damage per 5 feet moved
  ["ArcanomagneticRepulsion", SpellEnrichers.ArcanomagneticRepulsion],
  ["ForestGuard", SpellEnrichers.ForestGuard],
  ["ForestOfDread", SpellEnrichers.ForestOfDread],
  ["FreezingFog", SpellEnrichers.FreezingFog],
  ["GravityRepulsion", SpellEnrichers.GravityRepulsion],
  ["ShapePlants", SpellEnrichers.ShapePlants],
  ["SkeletalTail", SpellEnrichers.SkeletalTail],
  ["ValhallasCohort", SpellEnrichers.ValhallasCohort],
  ["WallOfGloom", SpellEnrichers.WallOfGloom],
];

function build(Enricher: TEnricher, options: Record<string, any> = {}): any {
  return makeEnricherData(Enricher, { name: "Test Spell", actions: null, data: { name: "Test Spell" }, ...options });
}

interface IBuiltActivity {
  name: string;
  id: string | undefined;
  data: Record<string, any>;
  duplicate: boolean;
}

/** The cast and every additional activity, flattened to what the region links depend on. */
function activities(e: any): IBuiltActivity[] {
  const primary = e.activity
    ? [{ name: e.activity.name ?? "", id: e.activity.id, data: e.activity.data ?? {}, duplicate: false }]
    : [];
  const extras = (e.additionalActivities ?? []).map((extra: any) => ({
    name: extra.init?.name ?? extra.overrides?.name ?? "",
    id: extra.id,
    data: extra.overrides?.data ?? {},
    duplicate: extra.duplicate === true,
  }));
  return [...primary, ...extras];
}

function named(e: any, name: string): IBuiltActivity {
  const found = activities(e).find((activity) => activity.name === name);
  if (!found) throw new Error(`no activity named "${name}"`);
  return found;
}

function behaviorsOf(activity: IBuiltActivity): any[] {
  return activity.data.behaviors ?? [];
}

function macros(activity: IBuiltActivity): any[] {
  return behaviorsOf(activity).filter((behavior) => behavior.type === "ddbMacro");
}

describe.each(REGION_SPELLS)("%s region links", (_label, Enricher) => {
  const e = build(Enricher);
  const all = activities(e);
  const names = all.map((activity) => activity.name);
  const ids = all.map((activity) => activity.id).filter((id) => id !== undefined);

  it("places at least one region", () => {
    expect(all.some((activity) => behaviorsOf(activity).length > 0)).toBe(true);
  });

  it("points every region trigger at a sibling that exists, by name or by id", () => {
    for (const activity of all) {
      for (const behavior of macros(activity)) {
        const { activityName } = behavior.config.args;
        const activityId = behavior.config.activity;
        expect(Boolean(activityName) || Boolean(activityId), activity.name).toBe(true);
        if (activityName) expect(names, `${activity.name} -> ${activityName}`).toContain(activityName);
        if (activityId) expect(ids, `${activity.name} -> ${activityId}`).toContain(activityId);
      }
    }
  });

  it("keeps the ongoing copy of a cast from placing a second region or spending a slot", () => {
    for (const extra of (e.additionalActivities ?? []).filter((a: any) => a.duplicate)) {
      expect(extra.id).toMatch(/^[A-Za-z0-9]{16}$/);
      expect(extra.overrides).toMatchObject({ removeSpellSlotConsume: true, noConsumeTargets: true, noTemplate: true });
      expect(extra.overrides.data.behaviors).toEqual([]);
    }
  });

  it("spends a slot on one way of casting only", () => {
    const consuming = (e.additionalActivities ?? []).filter((a: any) => a.build?.generateConsumption === true);
    // Wall of Death's ring is a second way to cast, allowed by name in the audit harness
    expect(consuming.length).toBeLessThanOrEqual(Enricher === SpellEnrichers.WallOfDeath ? 1 : 0);
    for (const extra of (e.additionalActivities ?? []).filter((a: any) => a.init && a.build?.generateConsumption !== true)) {
      expect(extra.build.noSpellslot, extra.init.name).toBe(true);
    }
  });

  it("never auto rolls from a region", () => {
    for (const activity of all) {
      for (const behavior of macros(activity)) expect(behavior.config.args.autoRoll).toBeUndefined();
    }
  });

  it("matches every named effect link to an activity that exists", () => {
    for (const effect of e.effects ?? []) {
      const matches = [effect.activityMatch, ...(effect.activitiesMatch ?? [])].filter(Boolean);
      for (const match of matches) expect(names, effect.name).toContain(match);
      if (!effect.standalone) expect(effect.options?.transfer, effect.name).toBe(false);
    }
  });

  it("gives every applied-while-inside effect a standalone definition with no expiry of its own", () => {
    const applied = all.flatMap((activity) => behaviorsOf(activity))
      .filter((behavior) => behavior.type === "applyActiveEffect")
      .flatMap((behavior) => behavior.config.effects as string[])
      .filter((effect) => !effect.startsWith("Compendium."));
    for (const name of applied) {
      const effect = (e.effects ?? []).find((hint: any) => hint.name === name);
      expect(effect, name).toBeDefined();
      expect(effect.standalone, name).toBe(true);
      expect(effect.options, name).toMatchObject({ expiry: null, durationSeconds: null });
    }
  });
});

describe("_SpellRegions builders", () => {
  it("makes the cast a utility that links no effects", () => {
    const cast = castPlacer([], { target: emanation("10") });
    expect(cast).toMatchObject({ name: "Cast", removeDamageParts: true, noeffect: true });
    expect(cast.data?.behaviors).toEqual([]);
  });

  it("restates who is affected when it overrides the target", () => {
    expect(emanation("30", "enemy")).toMatchObject({
      override: true,
      affects: { type: "enemy" },
      template: { type: "radius", size: "30", units: "ft" },
    });
    expect(area("line", "120", { width: "20" })).toMatchObject({
      override: true,
      affects: { type: "creature" },
      template: { type: "line", size: "120", width: "20" },
    });
  });

  it("leaves the save and damage of a built trigger to the spell parser", () => {
    const trigger = ongoingTrigger({ condition: "Starts its turn there" });
    expect(trigger.init).toMatchObject({ name: ONGOING, type: "save" });
    expect(trigger.build).toMatchObject({
      generateSave: true,
      generateDamage: true,
      generateConsumption: false,
      noSpellslot: true,
      activationOverride: { type: "special", condition: "Starts its turn there" },
      targetOverride: { affects: { count: "1", type: "creature" } },
    });
    expect(trigger.build?.saveOverride).toBeUndefined();
    expect(trigger.build?.damageParts).toBeUndefined();
  });

  it("types a trigger by what it rolls and can pick DDB damage parts and a different save", () => {
    expect(ongoingTrigger({ condition: "x", noSave: true }).init?.type).toBe("damage");
    expect(ongoingTrigger({ condition: "x", noSave: true, noDamage: true }).init?.type).toBe("utility");
    const force = ongoingTrigger({ condition: "x", damageParts: [1], saveAbility: "str" });
    expect(force.build).toMatchObject({
      partialDamageParts: [1],
      saveOverride: { ability: ["str"], dc: { calculation: "spellcasting" } },
    });
  });

  it("clones the cast as a free, untemplated roll", () => {
    const clone = ongoingClone("ddbTestSpellZon1", "Enters the area");
    expect(clone).toMatchObject({ duplicate: true, id: "ddbTestSpellZon1" });
    expect(clone.overrides).toMatchObject({ name: ONGOING, activationType: "special", activationCondition: "Enters the area" });
  });
});

describe("nothing rolled at the cast (utility Cast + built trigger)", () => {
  it.each([
    ["SearingSun", SpellEnrichers.SearingSun, ["tokenTurnStart"]],
    ["UmbralStorm", SpellEnrichers.UmbralStorm, ["tokenEnter", "tokenTurnStart"]],
    ["BlackRibbons", SpellEnrichers.BlackRibbons, ["tokenTurnEnd"]],
    ["ConjurePlants", SpellEnrichers.ConjurePlants, ["tokenEnter", "tokenTurnEnd"]],
  ] as [string, TEnricher, string[]][])("%s", (_label, Enricher, events) => {
    const e = build(Enricher);
    expect(e.type).toBe("utility");
    expect(macros(named(e, "Cast"))[0].config).toMatchObject({ events, args: { activityName: ONGOING } });
  });

  it("Butterfly Storm is the one spell that fires on exit", () => {
    const e = build(SpellEnrichers.ButterflyStorm);
    expect(macros(named(e, "Cast"))[0].config.events).toEqual(["tokenExit"]);
  });
});

describe("rolled at the cast (save stays the cast, cloned for the region)", () => {
  it.each([
    ["AcidRain", SpellEnrichers.AcidRain],
    ["MistOfMourning", SpellEnrichers.MistOfMourning],
    ["Bearstormer", SpellEnrichers.Bearstormer],
    ["DustOfSuleiman", SpellEnrichers.DustOfSuleiman],
  ] as [string, TEnricher][])("%s", (_label, Enricher) => {
    const e = build(Enricher);
    expect(e.type).toBeNull();
    const [clone] = e.additionalActivities;
    expect(e.activity.id).toMatch(/^[A-Za-z0-9]{16}$/);
    expect(e.activity.id).not.toBe(clone.id);
    expect(e.activity.data.behaviors[0].config).toMatchObject({
      events: ["tokenEnter", "tokenTurnEnd"],
      activity: clone.id,
    });
  });

  it("Bearstormer only reaches enemies, and Dust of Suleiman deals DDB's missing flat damage", () => {
    expect(build(SpellEnrichers.Bearstormer).activity.targetType).toBe("enemy");
    const [part] = build(SpellEnrichers.DustOfSuleiman).activity.damageParts;
    expect(part).toMatchObject({ custom: { enabled: true, formula: "20" }, types: ["force"] });
  });
});

describe("emanations on the caster", () => {
  it.each([
    ["AuraOfImpurity", SpellEnrichers.AuraOfImpurity, "30"],
    ["BlindingRadiance", SpellEnrichers.BlindingRadiance, "10"],
    ["VenomousAura", SpellEnrichers.VenomousAura, "10"],
    ["Tremor", SpellEnrichers.Tremor, "15"],
  ] as [string, TEnricher, string][])("%s restates DDB's area as a radius so it follows the token", (_label, Enricher, size) => {
    const cast = named(build(Enricher), "Cast");
    expect(cast.data.target).toMatchObject({ override: true, template: { type: "radius", size } });
    expect(macros(cast)[0].config.excludeSelf).toBe(true);
  });

  it("fires for enemies where the rules say creatures of the caster's choice", () => {
    for (const Enricher of [SpellEnrichers.ShadowDrain, SpellEnrichers.AuraOfDesecration, SpellEnrichers.AuraOfImpurity, SpellEnrichers.Dirge]) {
      const trigger = build(Enricher).additionalActivities[0];
      expect(trigger.build.targetOverride.affects.type).toBe("enemy");
    }
  });

  it("Crown of Radiance sizes by printing and filters to three creature types", () => {
    const legacy = named(build(SpellEnrichers.CrownOfRadiance, { is2014: true }), "Cast");
    const current = named(build(SpellEnrichers.CrownOfRadiance, { is2014: false }), "Cast");
    expect(legacy.data.target.template.size).toBe("20");
    expect(current.data.target.template.size).toBe("30");
    expect(macros(current)[0].config).toMatchObject({ types: ["fiend", "fey", "undead"], excludeSelf: true });
    // the light is the caster's own, so this cast keeps its effect link
    expect(build(SpellEnrichers.CrownOfRadiance).activity.noeffect).toBe(false);
  });

  it("Tremor supplies the Dexterity save DDB leaves out", () => {
    expect(build(SpellEnrichers.Tremor).additionalActivities[0].build.saveOverride.ability).toEqual(["dex"]);
  });
});

describe("several behaviors on one cast", () => {
  it("Arcanomagnetic Storm splits its two saves across events and DDB damage parts", () => {
    const e = build(SpellEnrichers.ArcanomagneticStorm);
    const [lightning, force] = macros(named(e, "Cast"));
    expect(lightning.config).toMatchObject({ events: ["tokenEnter", "tokenTurnStart"], args: { activityName: "Lightning Save" } });
    expect(force.config).toMatchObject({ events: ["tokenTurnEnd"], args: { activityName: "Force Save" } });
    const [first, second] = e.additionalActivities;
    expect(first.build.partialDamageParts).toEqual([0]);
    expect(second.build).toMatchObject({ partialDamageParts: [1], saveOverride: { ability: ["str"] } });
    expect(named(e, "Cast").data.target.template).toMatchObject({ type: "cube", count: "10", contiguous: true });
  });

  it("Mote of Hell is terrain, a stock Blinded effect, fire on turn start and a save on turn end", () => {
    const e = build(SpellEnrichers.MoteOfHell);
    const cast = named(e, "Cast");
    expect(behaviorsOf(cast).map((behavior) => behavior.type)).toEqual(["difficultTerrain", "applyActiveEffect", "ddbMacro", "ddbMacro"]);
    expect(behaviorsOf(cast)[1].config.effects).toEqual([SRDEffects.condition("blinded")]);
    // DDB's 30 ft is how far the screams carry; the cloud is 15
    expect(cast.data.target.template).toMatchObject({ type: "sphere", size: "15" });
    expect(e.additionalActivities[0].init.type).toBe("damage");
  });

  it("Crooked Ward carries the same type filter on both arms", () => {
    const cast = named(build(SpellEnrichers.CrookedWard), "Cast");
    const types = ["aberration", "fey", "fiend", "monstrosity", "undead"];
    expect(behaviorsOf(cast)[0]).toMatchObject({ type: "applyActiveEffect", config: { types } });
    expect(macros(cast)[0].config.types).toEqual(types);
  });

  it("Globe of Twilight conceals allies from the cast and dazzles enemies from the trigger", () => {
    const e = build(SpellEnrichers.GlobeOfTwilight);
    expect(e.activity.targetType).toBe("ally");
    expect(e.additionalActivities[0].build.targetOverride.affects.type).toBe("enemy");
  });

  it("Wall of Death offers a wall and a ring over one damage trigger", () => {
    const e = build(SpellEnrichers.WallOfDeath);
    expect(named(e, "Place Wall").data.target.template).toMatchObject({ type: "wall", size: "60" });
    expect(e.additionalActivities[0].build.targetOverride.template).toMatchObject({ type: "ring", size: "10" });
    for (const name of ["Place Wall", "Place Ring"]) {
      expect(macros(named(e, name))[0].config.args.activityName).toBe("Wall Damage");
    }
  });
});

describe("effects applied by a trigger", () => {
  it("anchors next-turn riders by the wording", () => {
    const expiry = (Enricher: TEnricher, name: string) => build(Enricher).effects.find((effect: any) => effect.name === name).options.expiry;
    expect(expiry(SpellEnrichers.ShadowDrain, "Shadow Drain: Drained")).toBe("targetEnd");
    expect(expiry(SpellEnrichers.BlindingRadiance, "Blinded")).toBe("targetStart");
    expect(expiry(SpellEnrichers.MistOfMourning, "Deep Melancholy")).toBe("targetEnd");
    expect(expiry(SpellEnrichers.GlobeOfTwilight, "Blinded")).toBe("turnEnd");
  });

  it("uses a free utility where the effect must outlast leaving the area", () => {
    for (const [Enricher, name] of [
      [SpellEnrichers.VenomousAura, "Venomous Aura: Poison"],
      [SpellEnrichers.FieldOfReaping, "Reaping Curse"],
    ] as [TEnricher, string][]) {
      const e = build(Enricher);
      expect(e.additionalActivities.find((a: any) => a.init.name === name).init.type).toBe("utility");
      expect(e.effects.some((effect: any) => effect.activityMatch === name)).toBe(true);
    }
  });

  it("Chains of Beleth restrains from the cast and the ongoing save, never from the crushing damage", () => {
    const e = build(SpellEnrichers.ChainsOfBeleth);
    expect(e.clearAutoEffects).toBe(true);
    expect(e.effects[0].activitiesMatch).toEqual(["Cast", "Ongoing Save"]);
    expect(e.additionalActivities[1]).toMatchObject({ init: { name: "Crushing Chains", type: "damage" }, build: { partialDamageParts: [1] } });
  });

  it("Ode to Wrath resolves the caster's modifier for melee weapon damage only", () => {
    const [effect] = build(SpellEnrichers.OdeToWrath).effects;
    expect(effect).toMatchObject({ standalone: true, originReplacement: true });
    expect(effect.changes[0].value).toBe("@attributes.spell.mod");
    expect(effect.changes[0].conditions).toBeTruthy();
    expect(build(SpellEnrichers.OdeToWrath).activity.data.target.affects.type).toBe("ally");
  });
});

describe("damage for every 5 feet moved", () => {
  it.each([
    ["FreezingFog", SpellEnrichers.FreezingFog, true, undefined],
    ["ForestOfDread", SpellEnrichers.ForestOfDread, true, [1]],
    ["ShapePlants", SpellEnrichers.ShapePlants, false, undefined],
  ] as [string, TEnricher, boolean, number[] | undefined][])("%s offers a free damage roll on every movement in or within the area", (_label, Enricher, casterImmune, parts) => {
    const e = build(Enricher);
    const movement = macros(named(e, "Cast")).find((behavior) => behavior.config.args.activityName === "Movement Damage");
    expect(movement.config.events).toEqual(["tokenMoveWithin"]);
    // per 5 feet, so not capped at once a turn
    expect(movement.config.oncePerTurn).toBe(false);
    expect(Boolean(movement.config.excludeSelf)).toBe(casterImmune);
    const roll = e.additionalActivities.find((a: any) => a.init?.name === "Movement Damage");
    expect(roll.init.type).toBe("damage");
    expect(roll.build).toMatchObject({ generateSave: false, generateDamage: true, noSpellslot: true });
    expect(roll.build.partialDamageParts).toEqual(parts);
  });

  it("Freezing Fog supplies the sphere DDB leaves out and slows from the save, not the movement", () => {
    const e = build(SpellEnrichers.FreezingFog);
    const cast = named(e, "Cast");
    expect(cast.data.target.template).toMatchObject({ type: "sphere", size: "20" });
    expect(behaviorsOf(cast).map((behavior) => behavior.type)).toEqual(["difficultTerrain", "ddbMacro", "ddbMacro"]);
    expect(macros(cast)[0].config).toMatchObject({ events: ["tokenMoveIn", "tokenTurnStart"], excludeSelf: true });
    expect(e.additionalActivities[0].build).toMatchObject({ generateSave: true, generateDamage: false });
    expect(e.effects[0]).toMatchObject({ activityMatch: "Ongoing Save", options: { expiry: "targetEnd" } });
  });

  it("Forest of Dread keeps the save as the cast, with DDB's first damage part only", () => {
    const e = build(SpellEnrichers.ForestOfDread);
    expect(e.type).toBeNull();
    expect(e.activity.removeDamageParts).toBe(true);
    expect(e.activity.damageParts).toHaveLength(1);
    // DDB's cylinder is kept: it is centred on the caster but must not follow them
    expect(e.activity.data.target).toBeUndefined();
    expect(e.effects[0]).toMatchObject({ standalone: true, statuses: ["coverHalf"] });
  });

  it("Shape Plants grows with the slot and lasts the hour DDB omits", () => {
    const cast = named(build(SpellEnrichers.ShapePlants), "Cast");
    expect(cast.data.target.template).toMatchObject({ type: "cube", size: "5 * @scaling" });
    expect(cast.data.duration).toMatchObject({ value: "1", units: "hour" });
    expect(behaviorsOf(cast)[0]).toMatchObject({ type: "difficultTerrain", config: { types: ["plants"] } });
  });
});

describe("attacks offered by a region", () => {
  it.each([
    ["ForestGuard", SpellEnrichers.ForestGuard, "Leaf Attack", ["tokenEnter", "tokenTurnStart"], "special", { type: "square", size: "25" }],
    ["SkeletalTail", SpellEnrichers.SkeletalTail, "Tail Strike", ["tokenMoveWithin"], "reaction", { type: "radius", size: "15" }],
    ["ValhallasCohort", SpellEnrichers.ValhallasCohort, "Cohort Attack", ["tokenEnter"], "special", { type: "square", size: "25" }],
  ] as [string, TEnricher, string, string[], string, Record<string, string>][])("%s casts as a utility and offers a free attack", (_label, Enricher, name, events, activation, template) => {
    const e = build(Enricher);
    expect(e.type).toBe("utility");
    const cast = named(e, "Cast");
    expect(cast.data.target).toMatchObject({ affects: { type: "enemy" }, template });
    expect(macros(cast)[0].config).toMatchObject({ events, args: { activityName: name } });
    const [attack] = e.additionalActivities;
    expect(attack.init).toEqual({ name, type: "attack" });
    expect(attack.build).toMatchObject({
      generateAttack: true, generateDamage: true, generateConsumption: false, noSpellslot: true,
      activationOverride: { type: activation }, targetOverride: { affects: { count: "1", type: "enemy" } },
    });
    expect(attack.overrides.noTemplate).toBe(true);
  });

  it("Skeletal Tail never offers the strike against the caster", () => {
    expect(macros(named(build(SpellEnrichers.SkeletalTail), "Cast"))[0].config.excludeSelf).toBe(true);
  });
});

describe("repulsion emanations", () => {
  it.each([
    ["GravityRepulsion", SpellEnrichers.GravityRepulsion, "Gravity Pulse"],
    ["ArcanomagneticRepulsion", SpellEnrichers.ArcanomagneticRepulsion, "Magnetic Pulse"],
  ] as [string, TEnricher, string][])("%s is enemy terrain that widens with the slot, with a bonus action pulse", (_label, Enricher, pulse) => {
    const e = build(Enricher);
    const cast = named(e, "Cast");
    expect(cast.data.target).toMatchObject({ affects: { type: "enemy" }, template: { type: "radius", size: "20 + 5 * @scaling.increase" } });
    expect(behaviorsOf(cast).map((behavior) => behavior.type)).toEqual(["difficultTerrain"]);
    const [save] = e.additionalActivities;
    expect(save.init).toEqual({ name: pulse, type: "save" });
    expect(save.build).toMatchObject({
      noSpellslot: true, activationOverride: { type: "bonus" },
      rangeOverride: { value: "20 + 5 * @scaling.increase", units: "ft" },
    });
    // no damage on a success
    expect(save.overrides.data.damage.onSave).toBe("none");
  });

  it("Gravity Repulsion links Prone to the pulse and keeps its ranged Disadvantage to midi", () => {
    const e = build(SpellEnrichers.GravityRepulsion);
    expect(e.clearAutoEffects).toBe(true);
    expect(e.activity.noeffect).toBe(false);
    const [prone, self] = e.effects;
    expect(prone).toMatchObject({ activityMatch: "Gravity Pulse", statuses: ["Prone"] });
    expect(self).toMatchObject({ activityMatch: "Cast", midiOnly: true });
    expect(self.changes ?? []).toEqual([]);
  });
});

describe("Wall of Gloom", () => {
  it("fires the wall's own save and leaves the 20-foot band to a save used by hand", () => {
    const e = build(SpellEnrichers.WallOfGloom);
    const cast = named(e, "Cast");
    // DDB's wall template is kept
    expect(cast.data.target).toBeUndefined();
    expect(macros(cast)).toHaveLength(1);
    expect(macros(cast)[0].config).toMatchObject({ events: ["tokenEnter", "tokenTurnEnd"], args: { activityName: "Wall Save" } });
    expect(e.additionalActivities.map((a: any) => a.init.name)).toEqual(["Wall Save", "Nearby Save"]);
    for (const extra of e.additionalActivities) expect(extra.build).toMatchObject({ generateSave: true, generateDamage: false });
    expect(e.effects.map((effect: any) => [effect.name, effect.activityMatch])).toEqual([
      ["Wall of Gloom: Exhaustion", "Wall Save"],
      ["Incapacitated", "Nearby Save"],
    ]);
  });
});
