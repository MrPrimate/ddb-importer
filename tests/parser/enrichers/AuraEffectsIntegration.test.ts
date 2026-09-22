// @vitest-environment jsdom
import { ClassEnrichers, DDBClassFeatureEnricher, GenericEnrichers } from "../../../src/parser/enrichers/_module";
import DDBEnricherData from "../../../src/parser/enrichers/data/DDBEnricherData";
import DDBFeatureActivity from "../../../src/parser/activities/DDBFeatureActivity";
import DDBEffectImporter from "../../../src/lib/DDBEffectImporter";
import JewelOfThreePrayers from "../../../src/parser/enrichers/item/JewelOfThreePrayers";
import FlameDamage from "../../../src/parser/enrichers/monster/FlamingSphere/FlameDamage";
import PackDamage from "../../../src/parser/enrichers/monster/ConjuredAnimals/PackDamage";
import { makeEnricherData } from "../../_fixtures/ddb/factories";
import { installActivityConfigStubs } from "../../_fixtures/ddb/stubs";
import { setMockSettings } from "../../_setup/foundryMocks";
import { createAuraRuntime, runtimeAvailable } from "../../_fixtures/auraEffectsRuntime.mjs";

type TConstructor = new (options: ConstructorParameters<typeof DDBEnricherData>[0]) => DDBEnricherData;

function modules({ aura = false, ac5e = false, midi = false, dae = false } = {}) {
  CONFIG.DDBI.EFFECT_CONFIG.MODULES.installedModules = {
    auraeffectsInstalled: aura, ac5eInstalled: ac5e, midiQolInstalled: midi, daeInstalled: dae,
    hasCore: midi && dae, hasMonster: midi && dae, tokenMagicInstalled: false,
    autoAnimationsInstalled: false, chrisInstalled: false, vision5eInstalled: false,
  };
}

/** Exercise the real hint consumer, including noCreate mutation and provider filtering. */
async function generate(Enricher: TConstructor, name: string, {
  parsed = false, is2014 = false, midi = false, displayName = name,
} = {}) {
  const doc = {
    _id: "auraItem12345678", name: displayName, type: "feat", img: "icons/svg/aura.svg",
    system: { description: { value: "Aura integration fixture." }, activities: {} },
    flags: { ddbimporter: {} },
    effects: parsed ? [{
      _id: "parsed1234567890", name: displayName, type: "base", transfer: true,
      flags: {}, system: { changes: [{ key: "system.rolls.ability.save.bonus", type: "add", value: "3" }] },
    }] : [],
  } as unknown as I5eFeatItem;
  const hints = makeEnricherData(Enricher, {
    name, data: doc, is2014, klass: "Paladin", ddbParser: { originalName: name, useMidiAutomations: midi },
  });
  const factory = new DDBClassFeatureEnricher({ activityGenerator: DDBFeatureActivity });
  Object.assign(factory, {
    ddbParser: hints.ddbParser, document: doc, loadedEnricher: hints, name, is2014, is2024: !is2014,
  });
  doc.effects!.push(...await factory.createEffects());
  const base = {
    _id: "place12345678901", name: "Place Aura", type: "utility", activation: {},
    consumption: { targets: [], scaling: {} }, target: { template: {}, affects: {} }, range: {},
  };
  const activity = await factory.applyActivityOverride(base);
  return { doc, hints, factory, activity, effects: doc.effects!, standalone: doc.flags.ddbimporter?.standaloneEffects ?? [] };
}

function auraSystem(effect: I5eEffectData): IDDBAuraEffects {
  expect(effect.type).toBe("auraeffects.aura");
  return effect.system!;
}

beforeEach(() => {
  installActivityConfigStubs();
  modules();
  setMockSettings({ "enable-ddb-macro-region-behaviors": true, "add-ddb-macro-region-behaviors": true });
});

describe("generated Protection providers", () => {
  it.each([[false, false], [false, true], [true, false], [true, true]])("AE=%s AC5e=%s uses exactly one provider", async (aura, ac5e) => {
    modules({ aura, ac5e });
    const { effects, standalone, activity } = await generate(GenericEnrichers.AuraOf, "Aura of Protection", { parsed: true });
    expect(effects.length + standalone.length).toBe(1);
    expect(activity.behaviors ?? []).toHaveLength(aura || ac5e ? 0 : 1);
    const effect = [...effects, ...standalone][0];
    const changes = effect.system!.changes!;
    expect(changes).toHaveLength(1);
    if (aura) {
      expect(auraSystem(effect)).toMatchObject({ bestFormula: "max(1, @abilities.cha.mod)", overrideName: "Aura of Protection", applyToSelf: true, canStack: false });
      expect(changes[0]).toMatchObject({ key: "system.rolls.ability.save.bonus", value: "+max(1, @abilities.cha.mod)" });
      expect(effect.transfer).toBe(true);
    } else if (ac5e) {
      expect(changes[0]).toMatchObject({ key: "flags.automated-conditions-5e.aura.save.bonus", type: "ac5e" });
      expect(changes[0].value).toContain("bonus=max(1, auraActor.abilities.cha.mod)");
    } else {
      expect(effect.transfer).toBe(false);
      expect(changes[0]).toMatchObject({ value: "+max(1, @abilities.cha.mod)", replacement: "origin" });
    }
  });

  it.each([true, false])("uses source eligibility for legacy=%s and a canonical identity", async (is2014) => {
    modules({ aura: true });
    const { effects } = await generate(GenericEnrichers.AuraOf, "Aura of Protection", {
      parsed: true, is2014, displayName: "AURA OF PROTECTION (Imported)",
    });
    const system = auraSystem(effects[0]);
    expect(system.overrideName).toBe("Aura of Protection");
    const eligible = new Function("sourceToken", `return ${system.script};`);
    expect(eligible({ actor: { statuses: new Set() } })).toBe(true);
    expect(eligible({ actor: { statuses: new Set([is2014 ? "unconscious" : "incapacitated"]) } })).toBe(false);
    expect(eligible({ actor: { statuses: new Set([is2014 ? "incapacitated" : "prone"]) } })).toBe(true);
  });
});

describe("generated class auras", () => {
  it.each([
    ["Aura of Protection", GenericEnrichers.AuraOf, "max(1, @abilities.cha.mod)", true],
    ["Aura of Hate", ClassEnrichers.Paladin.AuraOfHate, "max(1, @abilities.cha.mod)", false],
    ["Aura of the Sentinel", ClassEnrichers.Paladin.AuraOfTheSentinel, "@prof", true],
  ] as const)("preserves %s source ranking metadata through native standalone extraction", async (name, Enricher, bestFormula, parsed) => {
    const { doc, activity, standalone } = await generate(Enricher, name, {
      parsed, displayName: `${name.toUpperCase()} (Imported)`,
    });
    const metadata = { bestFormula, overrideName: name };
    expect(standalone).toHaveLength(1);
    expect(standalone[0].flags?.ddbimporter?.aura).toEqual(metadata);
    expect(standalone[0].transfer).toBe(false);
    doc.system.activities![activity._id] = activity;
    const changes = foundry.utils.deepClone(standalone[0].system!.changes);
    const [extracted] = DDBEffectImporter.extractStandaloneEffects([doc]);
    expect(extracted.flags?.ddbimporter?.aura).toEqual(metadata);
    expect(extracted.system!.changes).toEqual(changes);
    expect(activity.behaviors[0].config.effects[0]).toMatch(/^Compendium\./);
    expect(doc.flags.ddbimporter?.standaloneEffects).toBeUndefined();

    modules({ aura: true });
    const { effects } = await generate(Enricher, name, { parsed });
    expect(auraSystem(effects[0])).toMatchObject(metadata);
  });

  it("Hate includes its owner and Fiends/Undead in one ranked aura", async () => {
    modules({ aura: true });
    const { effects, standalone } = await generate(ClassEnrichers.Paladin.AuraOfHate, "Aura of Hate");
    expect(standalone).toEqual([]);
    expect(effects).toHaveLength(1);
    const system = auraSystem(effects[0]);
    expect(system).toMatchObject({ applyToSelf: true, bestFormula: "max(1, @abilities.cha.mod)", overrideName: "Aura of Hate", disposition: 0 });
    expect(system.changes[0].value).toBe("+max(1, @abilities.cha.mod)");
    const eligible = new Function("actor", "sourceToken", `return ${system.script};`);
    const owner = { uuid: "Actor.owner", system: { details: { type: { value: "humanoid" } } } };
    expect(eligible(owner, { actor: owner })).toBe(true);
    for (const [type, expected] of [["fiend", true], ["Undead", true], ["humanoid", false], ["beast", false]]) {
      expect(eligible({ uuid: "Actor.other", system: { details: { type: { value: type } } } }, { actor: owner })).toBe(expected);
    }
  });

  it("keeps Hate's native self and origin-based recipient effects", async () => {
    const { effects, standalone, activity } = await generate(ClassEnrichers.Paladin.AuraOfHate, "Aura of Hate");
    expect(effects).toHaveLength(1);
    expect(effects[0]).toMatchObject({ name: "Aura of Hate (Self)", transfer: true });
    expect(standalone[0].system!.changes![0]).toMatchObject({ value: "+max(1, @abilities.cha.mod)", replacement: "origin" });
    expect(activity.behaviors[0].config.types).toEqual(["fiend", "undead"]);
  });

  it("Sentinel ranks by source proficiency and requires an eligible source", async () => {
    modules({ aura: true });
    const { effects } = await generate(ClassEnrichers.Paladin.AuraOfTheSentinel, "Aura of the Sentinel", { parsed: true });
    const system = auraSystem(effects[0]);
    expect(system).toMatchObject({ bestFormula: "@prof", overrideName: "Aura of the Sentinel" });
    const eligible = new Function("sourceToken", `return ${system.script};`);
    expect(eligible({ actor: { statuses: new Set(["incapacitated"]) } })).toBe(false);
    expect(eligible({ actor: { statuses: new Set() } })).toBe(true);
  });

  it.each([false, true])("Steely-Eyed Aura preserves conditional AC5e support (%s)", async (ac5e) => {
    modules({ aura: true, ac5e });
    const { effects } = await generate(ClassEnrichers.Gunslinger.SteelyEyedAura, "Steely-Eyed Aura");
    expect(effects[0].system!.changes).toEqual(ac5e ? [expect.objectContaining({
      key: "flags.automated-conditions-5e.save.advantage", value: "riderStatuses.frightened",
    })] : []);
  });

  it.each([true, false])("Shielding Storm retains level gating, duration and distinct elements (legacy=%s)", async (is2014) => {
    modules({ aura: true });
    for (const [Enricher, element, damage] of [
      [ClassEnrichers.Barbarian.StormAuraDesert, "Desert", "fire"],
      [ClassEnrichers.Barbarian.StormAuraSea, "Sea", "lightning"],
      [ClassEnrichers.Barbarian.StormAuraTundra, "Tundra", "cold"],
    ] as const) {
      const { effects, standalone, factory, hints } = await generate(Enricher, `Storm Aura: ${element}`, { is2014 });
      const effect = effects.find((e) => e.name === `Shielding Storm: ${element}`)!;
      expect(standalone).toEqual([]);
      expect(effect).toMatchObject({ transfer: false, duration: { value: is2014 ? 60 : 600 }, flags: { ddbimporter: { activityMatch: "Activate Aura", effectIdLevel: { min: 10, max: null } } } });
      expect(auraSystem(effect)).toMatchObject({ bestFormula: "", overrideName: `Shielding Storm: ${element}`, canStack: false });
      expect(effect.system!.changes![0]).toMatchObject({ key: "system.traits.dr.value", value: damage });
      const activity = await factory._applyActivityDataOverride({ name: "Activate Aura" } as I5eActivity, hints.additionalActivities![0].overrides!);
      expect(activity.behaviors).toEqual([]);
    }
  });

  it.each([
    ["War", ClassEnrichers.Artificer.AuraOfWar], ["Shielding", ClassEnrichers.Paladin.AuraOfElementalShielding],
  ] as const)("keeps five equal-strength elemental identities in %s", async (_name, Enricher) => {
    modules({ aura: true });
    const { effects } = await generate(Enricher, "Elemental fixture");
    expect(effects).toHaveLength(5);
    expect(new Set(effects.map((e) => auraSystem(e).overrideName || e.name)).size).toBe(5);
    for (const effect of effects) expect(auraSystem(effect)).toMatchObject({ bestFormula: "", canStack: false });
  });
});

describe("generated Jewel and summon effects", () => {
  it.each([false, true])("Jewel keeps recipient walking speed with DAE=%s", async (dae) => {
    modules({ aura: true, dae });
    const { effects } = await generate(JewelOfThreePrayers, "Jewel of Three Prayers (Exalted)");
    const system = auraSystem(effects.find((e) => `${e.type}` === "auraeffects.aura")!);
    expect(system).toMatchObject({ bestFormula: "", canStack: false, evaluatePreApply: false });
    expect(system.changes[0].value).toBe(`${dae ? "##" : "@"}attributes.movement.speeds.walk`);
  });

  for (const Enricher of [FlameDamage, PackDamage]) {
    it.each([
      [false, false, false], [false, true, true], [true, false, true], [true, true, false], [true, true, true],
    ])(`${Enricher.name}: AE=%s Midi=%s enabled=%s retains exactly one functioning path`, async (aura, midi, enabled) => {
      modules({ aura, midi });
      const active = aura && midi && enabled;
      const { effects, activity, hints } = await generate(Enricher, Enricher.name, { midi: enabled });
      expect(activity.behaviors ?? []).toHaveLength(active ? 0 : 1);
      expect(effects).toHaveLength(active ? 1 : 0);
      if (Enricher === PackDamage) expect(hints.additionalActivities).toHaveLength(active ? 1 : 0);
      if (active) {
        expect(auraSystem(effects[0])).toMatchObject({
          bestFormula: "@flags.dnd5e.summon.level", canStack: false,
          overrideName: Enricher === FlameDamage ? "Flaming Sphere: Heat" : "Conjured Animals: Pack Damage",
        });
        expect(effects[0].system!.changes!.some((c) => c.key === "flags.midi-qol.OverTime")).toBe(true);
      }
    });
  }
});

describe.skipIf(!runtimeAvailable)("generated effects through the local Aura Effects runtime", () => {
  it.each([
    ["Sentinel", ClassEnrichers.Paladin.AuraOfTheSentinel, false],
    ["Heat", FlameDamage, true], ["Pack Damage", PackDamage, true],
  ] as const)("ranks %s by source statistics in either arrival order", async (_label, Enricher, midi) => {
    modules({ aura: true, midi });
    const { effects } = await generate(Enricher, Enricher.name, { midi, parsed: !midi });
    for (const levels of [[2, 5], [5, 2]]) {
      const runtime = createAuraRuntime();
      const recipient = runtime.actor();
      for (const value of levels) {
        await runtime.apply(recipient, [runtime.source(effects[0], {
          prof: value, flags: { dnd5e: { summon: { level: value } } },
        })]);
      }
      expect(recipient.effects).toHaveLength(1);
      expect(recipient.effects[0].flags.auraeffects.bestValue).toBe(5);
    }
  });

  it.each([[3, 5], [5, 3]])("selects +5 after sequential arrivals %s then %s, retaining unrelated bonuses", async (first, second) => {
    modules({ aura: true, ac5e: true });
    const { effects } = await generate(GenericEnrichers.AuraOf, "Aura of Protection", { parsed: true, displayName: "AURA OF PROTECTION (Imported)" });
    const runtime = createAuraRuntime();
    const unrelated = { _id: "unrelated", name: "Other bonus", flags: {}, system: { changes: [{ value: "2" }] } };
    const recipient = runtime.actor("Actor.recipient", [unrelated]);
    for (const mod of [first, second]) {
      await runtime.apply(recipient, [runtime.source(effects[0], { abilities: { cha: { mod } } })]);
    }
    expect(recipient.effects).toHaveLength(2);
    const winner = recipient.effects.find((e: I5eEffectData) => e.name === "Aura of Protection")!;
    expect(winner.flags.auraeffects.bestValue).toBe(5);
    expect(runtime.evaluate(winner.system.changes[0].value, { abilities: { cha: { mod: -2 } } })).toBe(5);
    expect(recipient.effects[0].system.changes[0].value).toBe("2");
  });

  it.each([false, true])("leaves equal-strength ties to preferLatest=%s", async (preferLatest) => {
    modules({ aura: true, midi: true });
    for (const [Enricher, name, options, rollData] of [
      [GenericEnrichers.AuraOf, "Aura of Protection", { parsed: true }, { abilities: { cha: { mod: 3 } } }],
      [FlameDamage, "Flame Damage", { midi: true }, { flags: { dnd5e: { summon: { level: 4 } } } }],
    ] as const) {
      const { effects } = await generate(Enricher, name, options);
      const runtime = createAuraRuntime({ preferLatest });
      const recipient = runtime.actor();
      const sources = [runtime.source(effects[0], rollData), runtime.source(effects[0], rollData)];
      for (const source of sources) await runtime.apply(recipient, [source]);
      expect(recipient.effects).toHaveLength(1);
      expect(recipient.effects[0].origin).toBe(sources[preferLatest ? 1 : 0].uuid);
    }
  });

  it.each([-2, 0, 1])("clamps rank and applied Protection/Hate bonuses for Charisma %s", async (mod) => {
    modules({ aura: true });
    for (const [Enricher, name] of [[GenericEnrichers.AuraOf, "Aura of Protection"], [ClassEnrichers.Paladin.AuraOfHate, "Aura of Hate"]] as const) {
      const { effects } = await generate(Enricher, name, { parsed: Enricher === GenericEnrichers.AuraOf });
      const runtime = createAuraRuntime();
      const recipient = runtime.actor();
      await runtime.apply(recipient, [runtime.source(effects[0], { abilities: { cha: { mod } } })]);
      expect(recipient.effects[0].flags.auraeffects.bestValue).toBe(1);
      expect(runtime.evaluate(recipient.effects[0].system.changes[0].value, {})).toBe(1);
    }
  });

  it.each([false, true])("resolves Jewel on the recipient after DAE=%s source handling", async (dae) => {
    modules({ aura: true, dae });
    const { effects } = await generate(JewelOfThreePrayers, "Jewel of Three Prayers (Exalted)");
    const runtime = createAuraRuntime({ dae });
    const recipient = runtime.actor();
    await runtime.apply(recipient, [runtime.source(effects.find((e) => `${e.type}` === "auraeffects.aura"), { attributes: { movement: { speeds: { walk: 60 } } } })]);
    const formula = recipient.effects[0].system.changes[0].value;
    expect(formula).toBe("@attributes.movement.speeds.walk");
    expect(runtime.evaluate(formula, { attributes: { movement: { speeds: { walk: 25 } } } })).toBe(25);
  });
});
