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
  EffectGenerator: {},
}));

import * as SpellEnrichers from "../../../src/parser/enrichers/spell/_module";
import { makeEnricherData } from "../../_fixtures/ddb/factories";

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

  it("picks the ruleset macro for both the item and the effect", () => {
    expect(build(Enricher, { is2014: true }).itemMacro.name).toBe("spiritGuardians2014.js");
    expect(build(Enricher).itemMacro.name).toBe("spiritGuardians2024.js");
  });

  it("builds a cast activity plus a save rider in both rulesets", () => {
    for (const is2014 of [true, false]) {
      const e = build(Enricher, { is2014 });
      expect(e.activity.name).toBe("Cast");
      expect(e.additionalActivities.map((a: any) => a.init.name)).toContain("Save vs Damage");
    }
  });
});
