/**
 * Spell enricher hints for ruleset branches and 5.x shapes the audit captures cannot pin on
 * their own. These assert the hints a DDBSpell consumes, not the built document.
 */
import * as SpellEnrichers from "../../../src/parser/enrichers/spell/_module";
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

describe("HolyAura", () => {
  it("gives attackers disadvantage against warded creatures in midi and AC5e", () => {
    const aura = build(SpellEnrichers.HolyAura).effects.find((effect: any) => effect.name === "Holy Aura (Aura)");
    expect(aura.midiChanges).toEqual([expect.objectContaining({ key: "flags.midi-qol.grants.disadvantage.attack.all", value: "1" })]);
    expect(aura.ac5eChanges).toEqual([expect.objectContaining({ key: "flags.automated-conditions-5e.grants.attack.disadvantage", value: "1" })]);
  });

  it("blinds until the spell ends in 2014 and until the end of the target's next turn in 2024", () => {
    const blinded = (is2014: boolean) => build(SpellEnrichers.HolyAura, { is2014 }).effects.find((e: any) => e.name === "Holy Aura: Blinded");
    expect(blinded(true).daeSpecialDurations).toBeUndefined();
    expect(blinded(false).daeSpecialDurations).toEqual(["turnEnd"]);
  });

  it("sheds the 2014 light from a caster-only ATL effect, never from the ally aura", () => {
    const effects = (is2014: boolean) => build(SpellEnrichers.HolyAura, { is2014 }).effects;
    const light = effects(true).find((e: any) => e.name === "Holy Aura: Light");
    expect(light).toMatchObject({ activityMatch: "Cast", atlOnly: true });
    expect(light.atlChanges).toContainEqual(expect.objectContaining({ key: "ATL.light.dim", value: "5" }));
    expect(effects(false).some((e: any) => e.name === "Holy Aura: Light")).toBe(false);

    for (const is2014 of [true, false]) {
      const aura = effects(is2014).find((e: any) => e.name === "Holy Aura (Aura)");
      expect(aura.atlChanges).toBeUndefined();
      expect(aura.changes.some((change: any) => change.key.includes("light"))).toBe(false);
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
  it("heats until the start of the caster's next turn", () => {
    const [hot] = build(SpellEnrichers.HeatMetal).effects;
    // pseudo expiries carry their own six-second span below dnd5e 6.0
    expect(hot.options).toMatchObject({ expiry: "sourceStart", durationSeconds: 6, durationRounds: 1 });
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
      expect(speedChanges[n * 2]).toMatchObject({ mode: CONST.ACTIVE_EFFECT_MODES.ADD, value: "0", priority: 49 });
      // above the usual priority-20 grants, so a speed another effect grants is capped too
      expect(speedChanges[(n * 2) + 1]).toMatchObject({ mode: CONST.ACTIVE_EFFECT_MODES.DOWNGRADE, value: "10", priority: 50 });
    });
  });
});

describe("FestivalKing", () => {
  it("casts as a utility whose aura is a 20-foot emanation on the king's token", () => {
    const e = build(SpellEnrichers.FestivalKing);
    expect(e.type).toBe("utility");
    expect(e.activity).toMatchObject({ name: "Cast", removeDamageParts: true, noeffect: true });
    expect(e.activity.data.target.template).toMatchObject({ type: "radius", size: "20" });
    expect(e.effects).toEqual([expect.objectContaining({ activityMatch: "Ongoing Save" })]);
  });
});
