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
import { installActivityConfigStubs } from "../../_fixtures/ddb/stubs";

type TEnricher = new (options: any) => any;

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

describe("HolyAura", () => {
  const effectNamed = (is2014: boolean, name: string) =>
    build(SpellEnrichers.HolyAura, { is2014 }).effects.find((effect: any) => effect.name === name);

  it("gives attackers disadvantage against warded creatures in midi and AC5e", () => {
    const aura = effectNamed(false, "Holy Aura (Aura)");
    expect(aura.midiChanges).toEqual([expect.objectContaining({ key: "flags.midi-qol.grants.disadvantage.attack.all", value: "1" })]);
    expect(aura.ac5eChanges).toEqual([expect.objectContaining({ key: "flags.automated-conditions-5e.grants.attack.disadvantage", value: "1" })]);
  });

  it("blinds until the spell ends in 2014 and until the end of the attacker's next turn in 2024", () => {
    expect(effectNamed(true, "Holy Aura: Blinded").daeSpecialDurations).toBeUndefined();
    expect(effectNamed(false, "Holy Aura: Blinded").daeSpecialDurations).toEqual(["turnEnd"]);
  });

  it("sheds the 2014 dim light from the caster only, never through the ally aura", () => {
    const light = effectNamed(true, "Holy Aura: Light");
    expect(light.activityMatch).toBe("Cast");
    expect(light.changes.length).toBeGreaterThan(0);
    expect(light.changes.every((change: any) => change.key.startsWith("token.light."))).toBe(true);
    expect(light.changes).toContainEqual(expect.objectContaining({ key: "token.light.dim", type: "upgrade", value: "5" }));
    expect(effectNamed(false, "Holy Aura: Light")).toBeUndefined();

    for (const is2014 of [true, false]) {
      const aura = effectNamed(is2014, "Holy Aura (Aura)");
      expect(aura.changes.some((change: any) => change.key.startsWith("token.light"))).toBe(false);
    }
  });

  it("lists the 2014 aura before the light and lets DAE apply the light to the caster", () => {
    const names = build(SpellEnrichers.HolyAura, { is2014: true }).effects.map((effect: any) => effect.name);
    // dnd5e 5.x's chat tray matches an applied effect by its shared concentration origin, so only the
    // first effect applied to the caster by hand lands: that must be the aura
    expect(names.indexOf("Holy Aura (Aura)")).toBeLessThan(names.indexOf("Holy Aura: Light"));
    const light = build(SpellEnrichers.HolyAura, { is2014: true }).effects.find((effect: any) => effect.name === "Holy Aura: Light");
    expect(light.data.flags.dae).toEqual({ selfTarget: true, selfTargetAlways: true });
  });
});

describe("HeatMetal", () => {
  it("keeps the heat until the start of the caster's next turn", () => {
    const [hot] = build(SpellEnrichers.HeatMetal).effects;
    expect(hot.options).toEqual({ expiry: "sourceStart" });
  });
});

describe("DispelEvilAndGood", () => {
  it("links its Warded effect to Ward Self", () => {
    const e = build(SpellEnrichers.DispelEvilAndGood);
    const ward = e.additionalActivities.find((a: any) => a.init?.name === "Ward Self");
    expect(ward.build.noeffect).toBeUndefined();
    expect(e.effects).toEqual([expect.objectContaining({ name: "Dispel Evil and Good: Warded", activityMatch: "Ward Self" })]);
  });
});

describe("BestowCurse", () => {
  const e = () => build(SpellEnrichers.BestowCurse);

  it("rolls the Resilience die when the caster later deals damage, not when the curse lands", () => {
    const resilience = e().additionalActivities.find((a: any) => a.overrides?.name === "Curse Resilience");
    expect(resilience.overrides.damageParts).toBeUndefined();
    const damage = e().additionalActivities.find((a: any) => a.init?.name === "Curse Damage");
    expect(damage.build).toMatchObject({ noSpellslot: true, noConcentration: true, generateDamage: true });
    expect(damage.build.damageParts[0]).toMatchObject({ number: 1, denomination: 8, types: ["necrotic"] });
    expect(damage.build.activationOverride.type).toBe("special");
  });

  it("limits the attack curse to attacks against the caster and adds the Resilience die through AC5e", () => {
    const effects = e().effects;
    const attacks = effects.find((effect: any) => effect.name === "Cursed Attacks");
    expect(attacks.midiChanges).toBeUndefined();
    expect(attacks.ac5eChanges[0]).toMatchObject({
      key: "flags.automated-conditions-5e.attack.disadvantage",
      value: "effectOriginTokenId === opponentId",
    });
    const resilience = effects.find((effect: any) => effect.name === "Cursed Resilience");
    expect(resilience.ac5eChanges[0].key).toBe("flags.automated-conditions-5e.grants.damage.bonus");
    expect(resilience.ac5eChanges[0].value).toContain("1d8[necrotic]");
  });

  it("curses one ability's checks and saves with disadvantage", () => {
    const strength = e().effects.find((effect: any) => effect.name === "Cursed Strength");
    expect(strength.changes.map((change: any) => change.key)).toEqual([
      "system.abilities.str.check.roll.mode",
      "system.abilities.str.save.roll.mode",
    ]);
  });

  it("words the action curse by ruleset", () => {
    const actions = (is2014: boolean) => build(SpellEnrichers.BestowCurse, { is2014 }).effects.find((effect: any) => effect.name === "Cursed Actions");
    expect(actions(true).options.description).toContain("waste its action");
    expect(actions(false).options.description).toContain("Dodge");
  });
});

describe("MarrowTransplant", () => {
  const Enricher = SpellEnrichers.MarrowTransplant;
  const upcast = { mode: "whole", number: 1, formula: "" };

  it("scales the attack damage by 1d6 per slot level, which DDB leaves off the damage modifier", () => {
    const attack = build(Enricher);
    attack.ddbEnricher._originalActivity = { type: "attack" };
    expect(attack.activity.data.damage.parts).toEqual([
      expect.objectContaining({ number: 4, denomination: 6, types: ["necrotic"], scaling: upcast }),
    ]);
  });

  it("scales the healing the same way, independent of DDB's modifier order", () => {
    const heal = build(Enricher);
    heal.ddbEnricher._originalActivity = { type: "heal" };
    expect(heal.activity.data.damage).toBeUndefined();
    expect(heal.activity.data.healing).toMatchObject({ number: 4, denomination: 6, types: ["healing"], scaling: upcast });
  });
});

describe("PowerWordPain", () => {
  it.each([[true], [false]])("caps every movement mode it has at 10 feet after other speed grants (2014: %s)", (is2014) => {
    const [pain] = build(SpellEnrichers.PowerWordPain, { is2014 }).effects;
    const speedChanges = pain.changes.filter((change: any) => change.key.startsWith("system.attributes.movement."));
    const modes = ["walk", "burrow", "climb", "fly", "swim"];
    expect(speedChanges.map((change: any) => change.key)).toEqual(
      modes.flatMap((mode) => [`system.attributes.movement.${mode}`, `system.attributes.movement.${mode}`]),
    );
    modes.forEach((_mode, n) => {
      // dnd5e 5.x turns a downgrade on an unset mode into an override, so an add of 0 comes first
      expect(speedChanges[n * 2]).toMatchObject({ type: "add", value: "0", priority: 49 });
      // above the usual priority-20 grants, so a speed another effect grants is capped too
      expect(speedChanges[(n * 2) + 1]).toMatchObject({ type: "downgrade", value: "10", priority: 50 });
    });
  });
});

describe("FestivalKing", () => {
  it("casts as a utility that places a 20-foot radius on the king's token and rolls nothing", () => {
    const e = build(SpellEnrichers.FestivalKing);
    expect(e.type).toBe("utility");
    expect(e.activity).toMatchObject({ name: "Cast", removeDamageParts: true, noeffect: true });
    expect(e.activity.data.target.template).toMatchObject({ type: "radius", size: "20" });
    expect(e.effects).toEqual([expect.objectContaining({ activityMatch: "Ongoing Save" })]);
  });
});
