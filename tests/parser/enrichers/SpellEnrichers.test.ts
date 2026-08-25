/**
 * A cross-section of the branchier spell enrichers.
 *
 * Spell enrichers fork on three axes the audit cannot cover from one capture:
 * the 2014/2024 ruleset, whether midi-qol is installed (`useMidiAutomations`),
 * and character state such as a class feature that upgrades the spell. The
 * spell audit replays RAW muncher payloads, which pin one ruleset and have no
 * character at all, so the feature-dependent and midi paths never run there —
 * and the audit is skipped outright in CI.
 *
 * See ClassEnrichers.test.ts for why the barrel mocks below are needed and why
 * DDBDataUtils is filled in beforeAll rather than in the mock factory.
 */
const loggerMock = vi.hoisted(() => ({
  warn: vi.fn(),
  debug: vi.fn(),
  info: vi.fn(),
  error: vi.fn(),
  verbose: vi.fn(),
}));

const parserLib = vi.hoisted(() => ({ DDBDataUtils: {} as any, DDBTemplateStrings: {} as any }));
/** Flipped per test to exercise the midi-only automation branches. */
const modules = vi.hoisted(() => ({ midiQolInstalled: true }));

vi.mock("../../../src/lib/_module", async () => ({
  logger: loggerMock,
  utils: (await vi.importActual<any>("../../../src/lib/Utils")).default,
}));
vi.mock("../../../src/parser/spells/CharacterSpellFactory", () => ({ default: class {} }));
vi.mock("../../../src/parser/spells/DDBSpell", () => ({ default: class {} }));
vi.mock("../../../src/parser/lib/_module", () => parserLib);
vi.mock("../../../src/parser/enrichers/effects/_module", async () => ({
  AutoEffects: { effectModules: () => modules },
  EnchantmentEffects: {},
  ChangeHelper: (await vi.importActual<any>("../../../src/parser/enrichers/effects/ChangeHelper")).default,
  BehaviorHelper: (await vi.importActual<any>("../../../src/parser/enrichers/effects/BehaviorHelper")).default,
  SRDEffects: (await vi.importActual<any>("../../../src/parser/enrichers/effects/SRDEffects")).default,
  EffectGenerator: {},
}));

import * as SpellEnrichers from "../../../src/parser/enrichers/spell/_module";
import { makeEnricherData } from "../../_fixtures/ddb/factories";
import { installActivityConfigStubs } from "../../_fixtures/ddb/stubs";
import SRDEffects from "../../../src/parser/enrichers/effects/SRDEffects";

beforeAll(() => {
  installActivityConfigStubs();
});

type TEnricher = new (options: any) => any;

beforeAll(async () => {
  const { default: DDBDataUtils } = await import("../../../src/parser/lib/DDBDataUtils");
  for (const key of Object.getOwnPropertyNames(DDBDataUtils)) {
    if (typeof (DDBDataUtils as any)[key] === "function") {
      parserLib.DDBDataUtils[key] = (DDBDataUtils as any)[key].bind(DDBDataUtils);
    }
  }
  Object.assign(parserLib.DDBTemplateStrings, await import("../../../src/parser/lib/DDBTemplateStrings"));
});

beforeEach(() => {
  modules.midiQolInstalled = true;
});

function build(Enricher: TEnricher, options: Record<string, any> = {}): any {
  return makeEnricherData(Enricher, { name: "Test Spell", ...options } as any);
}

/** A ranger who has the class feature that upgrades Hunter's Mark to a d10. */
const WITH_FOE_SLAYER = {
  classes: [{
    level: 17,
    definition: { name: "Ranger" },
    subclassDefinition: null,
    classFeatures: [{ definition: { name: "Foe Slayer", requiredLevel: 17 } }],
  }],
};

describe("HailOfThorns", () => {
  const Enricher = SpellEnrichers.HailOfThorns;

  it("casts through a self activity in 2014 and straight to the save in 2024", () => {
    const legacy = build(Enricher, { is2014: true });
    expect(legacy.type).toBe("utility");
    expect(legacy.activity).toMatchObject({ name: "Cast", targetType: "self", noTemplate: true });

    const modern = build(Enricher);
    expect(modern.type).toBe("none");
    expect(modern.activity).toBeNull();
  });

  it("makes the save a special-activation rider in 2014 and a bonus action in 2024", () => {
    const [legacy] = build(Enricher, { is2014: true }).additionalActivities;
    expect(legacy.overrides).toEqual({ activationType: "special", overrideActivation: true });
    expect(legacy.build).toMatchObject({ generateConsumption: true, noSpellslot: true });

    const [modern] = build(Enricher).additionalActivities;
    expect(modern.overrides).toEqual({ activationType: "bonus", overrideActivation: false });
    expect(modern.build).toMatchObject({ generateConsumption: false, noSpellslot: false });
  });

  it("only 2014 needs the macro effect, but both keep the 5 ft template", () => {
    expect(build(Enricher, { is2014: true }).effects[0].name).toBe("Hail of Thorns");
    expect(build(Enricher).effects).toEqual([]);
    // the item macro ships either way; the effect is what changes
    expect(build(Enricher).itemMacro).toEqual({ type: "spell", name: "hailOfThorns.js" });
    for (const is2014 of [true, false]) {
      expect(build(Enricher, { is2014 }).override.data.system.target.template)
        .toMatchObject({ type: "radius", size: "5", units: "ft" });
    }
  });
});

describe("HuntersMark", () => {
  const Enricher = SpellEnrichers.HuntersMark;

  it("takes any damage type in 2014 and force only in 2024", () => {
    const damageParts = (e: any): any => e.additionalActivities[0].build.damageParts[0];
    expect(damageParts(build(Enricher, { is2014: true })).types.length).toBeGreaterThan(1);
    expect(damageParts(build(Enricher)).types).toEqual(["force"]);
  });

  it("upgrades the die to a d10 for a 2024 ranger with Foe Slayer", () => {
    const die = (e: any): number => e.additionalActivities[0].build.damageParts[0].denomination;
    expect(die(build(Enricher))).toBe(6);
    expect(die(build(Enricher, { character: WITH_FOE_SLAYER }))).toBe(10);
    // 2014 Foe Slayer is a different feature entirely and must not upgrade the die
    expect(die(build(Enricher, { is2014: true, character: WITH_FOE_SLAYER }))).toBe(6);
  });

  it("matches the ac5e damage bonus to the die it just chose", () => {
    const bonus = (e: any): string => e.effects[0].ac5eChanges[0].value;
    expect(bonus(build(Enricher, { is2014: true }))).toContain("bonus=1d6;");
    expect(bonus(build(Enricher))).toContain("bonus=1d6[force];");
    expect(bonus(build(Enricher, { character: WITH_FOE_SLAYER }))).toContain("bonus=1d10[force];");
  });

  it("always offers a free move of the mark", () => {
    const [, move] = build(Enricher).additionalActivities;
    expect(move).toMatchObject({ duplicate: true });
    expect(move.overrides).toMatchObject({ name: "Move Hunter's Mark", removeSpellSlotConsume: true });
  });

  it("points the damage bonus macro at this item, not the global document", () => {
    // regression: this read the bare global `document`, so DDBMacros built the
    // macro reference from the DOM Document instead of the spell
    const spell = { name: "Hunter's Mark", flags: {} };
    const automation = build(Enricher, { data: spell }).effects
      .find((effect: any) => effect.name === "Hunter's Mark (Automation)");
    expect(automation.damageBonusMacroChanges[0].document).toBe(spell);
  });
});

describe("ThunderousSmite", () => {
  const Enricher = SpellEnrichers.ThunderousSmite;

  it("adds the 2014 midi cast activity only when midi is installed", () => {
    const names = (e: any): string[] => e.additionalActivities.map((a: any) => a.init.name);
    expect(names(build(Enricher, { is2014: true, ddbParser: { useMidiAutomations: true } })))
      .toEqual(["Save vs Pushed", "Cast (Automation)"]);

    modules.midiQolInstalled = false;
    expect(names(build(Enricher, { is2014: true, ddbParser: { useMidiAutomations: true } })))
      .toEqual(["Save vs Pushed"]);
  });

  it("never adds it for 2024, midi or not", () => {
    const e = build(Enricher, { ddbParser: { useMidiAutomations: true } });
    expect(e.additionalActivities.map((a: any) => a.init.name)).toEqual(["Save vs Pushed"]);
    expect(e.clearAutoEffects).toBe(false);
  });

  it("scales the thunder damage by whole slot levels", () => {
    expect(build(Enricher).activity.data.damage.parts[0]).toMatchObject({
      number: 2,
      denomination: 6,
      types: ["thunder"],
      scaling: { mode: "whole", number: 1 },
    });
  });
});

describe("BrandingSmite", () => {
  const Enricher = SpellEnrichers.BrandingSmite;

  it("adds the automation activity, effect and macro only for 2014 with midi", () => {
    const midi2014 = build(Enricher, { is2014: true, ddbParser: { useMidiAutomations: true } });
    expect(midi2014.additionalActivities).toHaveLength(1);
    expect(midi2014.clearAutoEffects).toBe(true);
    expect(midi2014.effects).toHaveLength(1);
    expect(midi2014.itemMacro).toMatchObject({ name: "brandingSmite.js" });

    const plain2014 = build(Enricher, { is2014: true });
    expect(plain2014.additionalActivities).toEqual([]);
    expect(plain2014.clearAutoEffects).toBe(false);
    // the macro is a 2014 concern regardless of midi
    expect(plain2014.itemMacro).toMatchObject({ name: "brandingSmite.js" });

    const modern = build(Enricher, { ddbParser: { useMidiAutomations: true } });
    expect(modern.additionalActivities).toEqual([]);
    expect(modern.itemMacro).toBeNull();
    expect(modern.setMidiOnUseMacroFlag).toBeNull();
  });
});

describe("Contagion", () => {
  const Enricher = SpellEnrichers.Contagion;

  it("picks the macro and the effect's activity for the ruleset", () => {
    const legacy = build(Enricher, { is2014: true });
    expect(legacy.itemMacro.name).toBe("contagion2014.js");
    expect(legacy.effects[0].activityMatch).toBe("Cast");
    expect(legacy.effects[0].macroChanges[0].macroName).toBe("contagion2014.js");

    const modern = build(Enricher);
    expect(modern.itemMacro.name).toBe("contagion2024.js");
    expect(modern.effects[0].activityMatch).toBe("Save");
  });

  it("names the effect for whether midi will drive it", () => {
    expect(build(Enricher, { is2014: true, ddbParser: { useMidiAutomations: true } }).effects[0].name)
      .toBe("Contagion");
    modules.midiQolInstalled = false;
    expect(build(Enricher, { is2014: true, ddbParser: { useMidiAutomations: true } }).effects[0].name)
      .toBe("Contagion: Poisoned");
  });

  it("keeps a stable activity id per original activity type", () => {
    // the id is referenced by the effect wiring, so it must not drift
    const asSave = makeEnricherData(Enricher, { ddbParser: { _originalActivity: { type: "save" } } } as any);
    // _originalActivity lives on the enricher, not the parser, so the default applies here
    expect(asSave.activity).toEqual({ id: "ddbContagionCast", name: "Cast" });
  });
});

describe("SpiritGuardians", () => {
  const Enricher = SpellEnrichers.SpiritGuardians;

  it("builds the core single save activity with the Half Speed effect applied on save", () => {
    for (const is2014 of [true, false]) {
      const e = build(Enricher, { is2014 });
      expect(e.type).toBe("save");
      expect(e.activity.name).toBe("Cast and Save");
      expect(e.activity.damageParts).toHaveLength(1);
      expect(e.activity.data.damage.onSave).toBe("half");
      expect(e.additionalActivities).toBeNull();
      expect(e.itemMacro).toBeNull();
      const [halfSpeed] = e.effects;
      expect(halfSpeed.name).toBe("Half Speed");
      expect(halfSpeed.onSave).toBe(true);
      expect(halfSpeed.changes).toEqual([
        expect.objectContaining({ key: "system.attributes.movement.multiplier", type: "multiply", value: "0.5" }),
      ]);
      expect(halfSpeed.data.duration.expiry).toBe("turnStart");
    }
  });
});

describe("region behavior spells", () => {
  it("Silence applies the stock silenced/deafened/thunder-immunity effects through an applyActiveEffect behavior", () => {
    const e = build(SpellEnrichers.Silence);
    expect(e.type).toBe("utility");
    expect(e.activity.data.behaviors).toEqual([
      expect.objectContaining({
        type: "applyActiveEffect",
        config: {
          effects: [
            SRDEffects.condition("silenced"),
            SRDEffects.condition("deafened"),
            SRDEffects.damageImmunity("thunder"),
          ],
          sizes: [],
          types: [],
        },
      }),
    ]);
    expect(e.effects).toEqual([]);
    expect(e.itemMacro).toBeNull();
    expect(e.setMidiOnUseMacroFlag).toBeNull();
  });

  it("Aura of Life applies the stock necrotic resistance to allies", () => {
    const e = build(SpellEnrichers.AuraOfLife);
    expect(e.activity.data.behaviors[0].config.effects).toEqual([SRDEffects.damageResistance("necrotic")]);
    expect(e.effects).toEqual([]);
    expect(e.override.data.system.target.affects.type).toBe("ally");
  });

  it.each([
    ["SpikeGrowth", ["plants"]],
    ["Entangle", ["plants"]],
    ["Web", ["web"]],
    ["SleetStorm", ["ice"]],
    ["IceStorm", ["ice"]],
    ["BlackTentacles", []],
    ["InsectPlague", []],
    ["BladeBarrier", []],
    ["StormOfVengeance", []],
    ["Grease", []],
    ["ConjureMinorElementals", []],
  ])("%s emits a difficultTerrain behavior with types %j", (name, types) => {
    const e = build((SpellEnrichers as any)[name]);
    expect(e.activity.data.behaviors).toContainEqual(
      expect.objectContaining({ type: "difficultTerrain", config: { types } }),
    );
  });

  it("Spike Growth is a single damage activity", () => {
    const e = build(SpellEnrichers.SpikeGrowth);
    expect(e.type).toBe("damage");
    expect(e.activity.damageParts[0]).toMatchObject({ number: 2, denomination: 4, types: ["piercing"] });
    expect(e.additionalActivities).toBeNull();
  });

  it.each(["Cloudkill", "IncendiaryCloud", "Moonbeam", "CreateBonfire", "SpellfireStorm", "ConjureWoodlandBeings", "Web", "Grease", "InsectPlague"])(
    "%s no longer carries ActiveAuras machinery", (name) => {
      const e = build((SpellEnrichers as any)[name]);
      for (const effect of e.effects ?? []) {
        expect(effect.activeAurasOnly).toBeUndefined();
        expect(effect.data?.flags?.ActiveAuras).toBeUndefined();
        expect(effect.macroChanges).toBeUndefined();
      }
      expect(e.setMidiOnUseMacroFlag).toBeNull();
      expect(e.override?.data?.flags?.ddbimporter?.effect).toBeUndefined();
    });
});

describe("native aura spells", () => {
  it.each([
    ["CrusadersMantle", "Crusader's Mantle"],
    ["PassWithoutTrace", "Pass without Trace"],
    ["CircleOfPower", "Circle of Power"],
    ["HolyAura", "Holy Aura"],
    ["AlustrielsMooncloak", "Within Moonlight"],
    ["AuraOfPurity", "Aura of Purity"],
  ])("%s applies a standalone %s effect through applyActiveEffect", (name, effectName) => {
    const e = build((SpellEnrichers as any)[name]);
    const behaviors = e.activity.data.behaviors;
    expect(behaviors.some((b: any) => b.type === "applyActiveEffect" && b.config.effects.includes(effectName))).toBe(true);
    const standalone = e.effects.find((effect: any) => effect.name === effectName);
    expect(standalone.standalone).toBe(true);
    expect(e.effects.some((effect: any) => effect.auraeffects)).toBe(false);
  });

  it.each([
    ["WardingWind", []],
    ["DarkStar", []],
    ["HungerOfHadar", []],
    ["EruptingEarth", ["rocks"]],
    ["EarthTremor", ["rocks"]],
    ["WrathOfNature", ["plants"]],
    ["Earthquake", ["rocks"]],
    ["WallOfWater", ["liquid"]],
    ["InvestitureOfIce", ["ice"]],
  ])("%s emits difficultTerrain %j", (name, types) => {
    const e = build((SpellEnrichers as any)[name]);
    expect(e.activity.data.behaviors.some((b: any) => b.type === "difficultTerrain" && b.config.types.join() === types.join())).toBe(true);
  });
});

describe("region dispositions via target.affects.type", () => {
  it.each([
    ["CrusadersMantle", "ally"],
    ["PassWithoutTrace", "ally"],
    ["HolyAura", "ally"],
    ["AlustrielsMooncloak", "ally"],
    ["AuraOfPurity", "ally"],
    ["CircleOfPower", "ally"],
    ["ConjureMinorElementals", "enemy"],
    ["WrathOfNature", "enemy"],
  ])("%s targets %s so the placed region derives that disposition", (name, affects) => {
    const e = build((SpellEnrichers as any)[name]);
    expect(e.override.data.system.target.affects.type).toBe(affects);
  });
});

describe("stock SRD zone effects", () => {
  it.each([
    ["HungerOfHadar", [SRDEffects.condition("blinded")]],
    ["JallarzisStormOfRadiance", [SRDEffects.condition("blinded"), SRDEffects.condition("deafened")]],
    ["WardingWind", [SRDEffects.condition("deafened")]],
    ["DarkStar", [SRDEffects.condition("deafened"), SRDEffects.damageImmunity("thunder")]],
    ["AuraOfPurity", [SRDEffects.damageResistance("poison"), "Aura of Purity"]],
  ])("%s applies %j", (name, effects) => {
    const e = build((SpellEnrichers as any)[name]);
    const behavior = e.activity.data.behaviors.find((b: any) => b.type === "applyActiveEffect");
    expect(behavior.config.effects).toEqual(effects);
  });
});

describe("ddbMacro region automation behaviors", () => {
  it.each([
    ["Moonbeam", ["tokenEnter", "tokenTurnEnd"], "ddbMoonbeamZone1"],
    ["Cloudkill", ["tokenEnter", "tokenTurnEnd"], "ddbCloKilZoneSa1"],
    ["IncendiaryCloud", ["tokenEnter", "tokenTurnEnd"], "ddbIncCloZoneSa1"],
    ["CreateBonfire", ["tokenEnter", "tokenTurnEnd"], "ddbBonfirZoneSa1"],
    ["Web", ["tokenEnter", "tokenTurnStart"], "ddbWebSpellZone1"],
    ["InsectPlague", ["tokenEnter", "tokenTurnEnd"], "ddbInsPlaZoneSa1"],
    ["SleetStorm", ["tokenEnter", "tokenTurnStart"], "ddbSleetStZoneS1"],
    ["SpellfireStorm", ["tokenEnter", "tokenTurnEnd"], "ddbSpellStormSa1"],
    ["ConjureWoodlandBeings", ["tokenEnter", "tokenTurnEnd"], "ddbConjWoodBeSav"],
  ])("%s triggers useActivity against its no-consumption ongoing activity on %j", (name, events, activity) => {
    const e = build((SpellEnrichers as any)[name]);
    const macro = e.activity.data.behaviors.find((b: any) => b.type === "ddbMacro");
    expect(macro.config.function).toBe("useActivity");
    expect(macro.config.events).toEqual(events);
    expect(macro.config.activity).toBe(activity);
    expect(macro.config.args).toEqual({});
    expect(macro.config).toMatchObject({ oncePerTurn: true, scale: true, macroParameters: "{}" });
  });

  it.each([
    ["Moonbeam", "ddbMoonbeamZone1"],
    ["Cloudkill", "ddbCloKilZoneSa1"],
    ["IncendiaryCloud", "ddbIncCloZoneSa1"],
    ["CreateBonfire", "ddbBonfirZoneSa1"],
    ["Web", "ddbWebSpellZone1"],
    ["Grease", "ddbGreaseZoneSa1"],
    ["InsectPlague", "ddbInsPlaZoneSa1"],
    ["SleetStorm", "ddbSleetStZoneS1"],
    ["BlackTentacles", "ddbBlaTenZoneSa1"],
  ])("%s duplicates its save as a special-activation Ongoing Save without consumption", (name, id) => {
    const e = build((SpellEnrichers as any)[name]);
    const ongoing = e.additionalActivities.find((a: any) => a.id === id);
    expect(ongoing.duplicate).toBe(true);
    expect(ongoing.overrides).toMatchObject({
      name: "Ongoing Save",
      activationType: "special",
      removeSpellSlotConsume: true,
      noConsumeTargets: true,
      noTemplate: true,
    });
    expect(ongoing.overrides.data.behaviors).toEqual([]);
  });

  it("Grease saves on every entry because neither ruleset limits it to once per turn", () => {
    const e = build(SpellEnrichers.Grease);
    const macro = e.activity.data.behaviors.find((b: any) => b.type === "ddbMacro");
    expect(macro.config.events).toEqual(["tokenEnter", "tokenTurnEnd"]);
    expect(macro.config.activity).toBe("ddbGreaseZoneSa1");
    expect(macro.config.oncePerTurn).toBe(false);
  });

  it.each([
    ["Moonbeam"],
    ["Cloudkill"],
  ])("%s uses turn start in 2014 and turn end in 2024", (name) => {
    expect(build((SpellEnrichers as any)[name], { is2014: true }).activity.data.behaviors
      .find((b: any) => b.type === "ddbMacro").config.events).toEqual(["tokenEnter", "tokenTurnStart"]);
    expect(build((SpellEnrichers as any)[name]).activity.data.behaviors
      .find((b: any) => b.type === "ddbMacro").config.events).toEqual(["tokenEnter", "tokenTurnEnd"]);
  });

  it("Black Tentacles branches the turn event by ruleset", () => {
    expect(build(SpellEnrichers.BlackTentacles, { is2014: true }).activity.data.behaviors[1].config.events)
      .toEqual(["tokenEnter", "tokenTurnStart"]);
    expect(build(SpellEnrichers.BlackTentacles).activity.data.behaviors[1].config.events)
      .toEqual(["tokenEnter", "tokenTurnEnd"]);
    const config = build(SpellEnrichers.BlackTentacles).activity.data.behaviors[1].config;
    expect(config.activity).toBe("ddbBlaTenZoneSa1");
    // 2024: "A creature makes this save only once per turn."
    expect(config.oncePerTurn).toBe(true);
  });

  it("Hunger of Hadar wires its two per-turn activities by name", () => {
    const e = build(SpellEnrichers.HungerOfHadar);
    const macros = e.activity.data.behaviors.filter((b: any) => b.type === "ddbMacro");
    expect(macros.map((m: any) => [m.config.events[0], m.config.args.activityName])).toEqual([
      ["tokenTurnStart", "Start of Turn Damage"],
      ["tokenTurnEnd", "End of Turn Save vs Damage"],
    ]);
  });
});

describe("C/D region candidates wave", () => {
  it.each([
    ["GustOfWind", ["tokenTurnEnd"], "ddbGustWiZoneSa1", []],
    ["StormSphere", ["tokenTurnEnd"], "ddbStormSpZoneS1", [""]],
    ["DarkStar", ["tokenEnter", "tokenTurnStart"], "ddbDarkStZoneSa1", [""]],
    ["JallarzisStormOfRadiance", ["tokenEnter", "tokenTurnEnd"], "ddbJalStoZoneSa1", []],
    ["SickeningRadiance", ["tokenEnter", "tokenTurnStart"], "ddbSickRaZoneSa1", []],
    ["ZoneOfTruth", ["tokenEnter", "tokenTurnStart"], "ddbZonTruZoneSa1", []],
    ["StinkingCloud", ["tokenTurnStart"], "ddbStiCloZoneSa1", []],
    ["Dawn", ["tokenTurnEnd"], "ddbDawnSpZoneSa1", []],
    ["MaddeningDarkness", ["tokenTurnStart"], "ddbMadDarZoneSa1", []],
    ["Whirlwind", ["tokenEnter"], "ddbWhirlwZoneSa1", []],
    ["Maelstrom", ["tokenTurnStart"], "ddbMaelstZoneSa1", [""]],
    ["YolandesRegalPresence", ["tokenEnter", "tokenTurnEnd"], "ddbYolRegZoneSa1", []],
    ["RavenousVoid", ["tokenEnter", "tokenTurnStart"], "ddbRavVoiZoneSa1", [""]],
    ["DustDevil", ["tokenTurnEnd"], "ddbDustDeZoneSa1", []],
    ["CordonOfArrows", ["tokenEnter", "tokenTurnEnd"], "ddbCorArrZoneSa1", []],
    ["HealingSpirit", ["tokenEnter", "tokenTurnStart"], "ddbHeaSpiZoneHe1", []],
    ["CloudOfDaggers", ["tokenEnter", "tokenTurnEnd"], "ddbCloDagZoneDa1", []],
    ["TransmuteRock", ["tokenEnter", "tokenTurnEnd"], "ddbTraRocZoneSa1", ["mud"]],
  ])("%s triggers its ongoing activity on %j", (name, events, activityId, terrain) => {
    const e = build((SpellEnrichers as any)[name]);
    const macro = e.activity.data.behaviors.find((b: any) => b.type === "ddbMacro");
    expect(macro.config.events).toEqual(events);
    expect(macro.config.activity).toBe(activityId);
    const dts = e.activity.data.behaviors.filter((b: any) => b.type === "difficultTerrain");
    expect(dts.map((b: any) => b.config.types.join())).toEqual(terrain.length && terrain[0] === "" ? [""] : terrain.length ? terrain : []);
    const ongoing = (e.additionalActivities ?? []).find((a: any) => a.overrides?.id === activityId || a.id === activityId);
    if (ongoing?.duplicate) expect(ongoing.overrides.data.behaviors).toEqual([]);
  });

  it.each([
    ["WallOfFire", "Damage", ["tokenEnter", "tokenTurnEnd"]],
    ["WallOfThorns", "Save to Travel Through Wall", ["tokenEnter", "tokenTurnEnd"]],
    ["WallOfLight", "Turn End Damage", ["tokenTurnEnd"]],
    ["WallOfIce", "Frigid Air Save", ["tokenEnter"]],
  ])("%s wires %s by name", (name, activityName, events) => {
    const e = build((SpellEnrichers as any)[name]);
    const macro = e.activity.data.behaviors.find((b: any) => b.type === "ddbMacro");
    expect(macro.config.events).toEqual(events);
    expect(macro.config.args.activityName).toBe(activityName);
  });

  it("Gust of Wind uses turn start in 2014", () => {
    const macro = build(SpellEnrichers.GustOfWind, { is2014: true }).activity.data.behaviors.find((b: any) => b.type === "ddbMacro");
    expect(macro.config.events).toEqual(["tokenTurnStart"]);
  });

  it("Cloud of Daggers uses turn start in 2014 and its duplicate is a damage clone", () => {
    const macro = build(SpellEnrichers.CloudOfDaggers, { is2014: true }).activity.data.behaviors.find((b: any) => b.type === "ddbMacro");
    expect(macro.config.events).toEqual(["tokenEnter", "tokenTurnStart"]);
    expect(build(SpellEnrichers.CloudOfDaggers).additionalActivities[0].overrides.name).toBe("Ongoing Damage");
  });

  it("Investiture of Flame builds its emanation, aura damage and flame line", () => {
    const e = build(SpellEnrichers.InvestitureOfFlame);
    const macro = e.activity.data.behaviors.find((b: any) => b.type === "ddbMacro");
    expect(macro.config.args.activityName).toBe("Aura Damage");
    expect(e.activity.data.target.template).toMatchObject({ type: "radius", size: "5" });
    expect(e.additionalActivities.map((a: any) => a.init.name)).toEqual(["Aura Damage", "Flame Line"]);
    expect(e.effects[0].changes.map((c: any) => c.value)).toEqual(["fire", "cold"]);
  });
});
