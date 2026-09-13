/**
 * P2.2 Group B: effects that used to grant advantage or disadvantage only through midi-QOL or
 * AC5e flags now carry the native dnd5e 6 change - an ability/skill roll mode, a per-ability
 * attack roll mode, or an `attack`/`save`/`check`/`d20` rule change - so they work with no
 * modules installed.
 *
 * These pin three things per enricher: the native change is present, the redundant self-side
 * module flag is gone, and whatever the modules still own (grants-side flags, AC5e `once`, DAE
 * usage tokens) survived the conversion. The audit harness runs module-free and never sees
 * module flags, so nothing else would notice a flag quietly coming back.
 *
 * No vi.mock preamble: see ClassEnrichers.test.ts.
 */
import * as ClassEnrichers from "../../../src/parser/enrichers/class/_module";
import * as FeatEnrichers from "../../../src/parser/enrichers/feat/_module";
import * as GenericEnrichers from "../../../src/parser/enrichers/generic/_module";
import * as ItemEnrichers from "../../../src/parser/enrichers/item/_module";
import * as MonsterEnrichers from "../../../src/parser/enrichers/monster/_module";
import * as SpellEnrichers from "../../../src/parser/enrichers/spell/_module";
import * as TraitEnrichers from "../../../src/parser/enrichers/trait/_module";
import { makeEnricherData } from "../../_fixtures/ddb/factories";
import { installActivityConfigStubs } from "../../_fixtures/ddb/stubs";

beforeAll(() => {
  // ChangeHelper's advantage/disadvantage getters read CONFIG.Dice.D20Roll.ADV_MODE
  installActivityConfigStubs();
});

type TEnricher = new (options: any) => any;
type THint = Record<string, any>;

function build(Enricher: TEnricher, options: Parameters<typeof makeEnricherData>[1] = {}): any {
  return makeEnricherData(Enricher, options);
}

const SELF_ATTACK_FLAG = /^flags\.midi-qol\.(advantage|disadvantage)\.attack\./;

function attackRules(hint: THint): any[] {
  return (hint.changes ?? []).filter((c: any) => c.key === "attack" && c.type === "dnd5e.advantage");
}

function midiKeys(hint: THint): string[] {
  return (hint.midiChanges ?? []).map((c: any) => c.key);
}

function ac5eChanges(hint: THint): any[] {
  return hint.ac5eChanges ?? [];
}

/** The self-side midi attack flag and any plain "1" AC5e attack flag must be gone. */
function expectNoRedundantModuleFlags(hint: THint): void {
  expect(midiKeys(hint).filter((k) => SELF_ATTACK_FLAG.test(k))).toEqual([]);
  expect(ac5eChanges(hint).filter((c) => c.key.startsWith("flags.automated-conditions-5e.attack.") && c.value === "1")).toEqual([]);
  expect(hint.midiOnly).toBeUndefined();
  expect(hint.ac5eOnly).toBeUndefined();
}

function expectAttackRule(hint: THint, value: "1" | "-1", conditions?: unknown): void {
  const rules = attackRules(hint);
  expect(rules).toHaveLength(1);
  expect(rules[0]).toMatchObject({ key: "attack", type: "dnd5e.advantage", value, priority: 20 });
  if (conditions === undefined) expect(rules[0].conditions).toBeUndefined();
  else expect(JSON.parse(rules[0].conditions)).toEqual(conditions);
  expectNoRedundantModuleFlags(hint);
}

describe("ability and skill roll modes replace module flags", () => {
  it("Adjust Density scopes each arm's Strength modes natively", () => {
    const [halved, doubled] = build(ClassEnrichers.Wizard.AdjustDensity).effects;
    expect(halved.name).toBe("Adjust Density: Halved Weight");
    expect(halved.changes.map((c: any) => [c.key, c.value])).toEqual([
      ["system.attributes.movement.bonus", "10"],
      ["system.abilities.str.check.roll.mode", "-1"],
      ["system.abilities.str.save.roll.mode", "-1"],
    ]);
    expect(doubled.changes.map((c: any) => [c.key, c.value])).toEqual([
      ["system.attributes.movement.bonus", "-10"],
      ["system.abilities.str.check.roll.mode", "1"],
      ["system.abilities.str.save.roll.mode", "1"],
    ]);
    for (const hint of [halved, doubled]) {
      expect(hint.midiChanges).toBeUndefined();
      expect(hint.ac5eChanges).toBeUndefined();
      expect(hint.options.durationSeconds).toBe(60);
    }
  });

  it("Shimmerskin grants Charisma check advantage natively", () => {
    const [effect] = build(TraitEnrichers.Shimmerskin.Shimmerskin).effects;
    expect(effect.name).toBe("Shimmering Skin");
    expect(effect.changes).toEqual([
      { key: "system.abilities.cha.check.roll.mode", value: "1", type: "add", priority: 20 },
    ]);
    expect(effect.midiChanges).toBeUndefined();
    expect(effect.ac5eChanges).toBeUndefined();
    expect(effect.options.durationSeconds).toBe(600);
  });

  it("Cloak of Shadows (Enshrouded) keeps its DAE one-check token beside the native Stealth mode", () => {
    const [effect] = build(FeatEnrichers.CloakOfShadowsEnshrouded).effects;
    expect(effect.changes).toEqual([
      { key: "system.skills.ste.roll.mode", value: "1", type: "add", priority: 20 },
    ]);
    expect(effect.daeSpecialDurations).toEqual(["isSkill.ste"]);
    expect(effect.options.expiry).toBe("turnEnd");
    expect(effect.midiChanges).toBeUndefined();
    expect(effect.ac5eChanges).toBeUndefined();
  });

  it("Wood Wose adds the Strength and Constitution save advantage to its AC formula effect", () => {
    const effects = build(ClassEnrichers.Druid.WoodWose).effects;
    const wose = effects.find((e: any) => e.name === "Wood Wose");
    expect(wose.changes.map((c: any) => c.key)).toEqual([
      "system.attributes.ac.formulas",
      "system.abilities.str.save.roll.mode",
      "system.abilities.con.save.roll.mode",
    ]);
    expect(wose.midiChanges).toBeUndefined();
    // the sap's "targets other than the druid" clause is target-relative and stays on midi
    const sap = effects.find((e: any) => e.name === "Coated in Elderwood Sap");
    expect(sap.changes).toBeUndefined();
    expect(midiKeys(sap)).toEqual(["flags.midi-qol.disadvantage.attack.all"]);
  });

  it("Slowing Breath adds the 2024 Dexterity save disadvantage natively and not on 2014", () => {
    const [modern] = build(MonsterEnrichers.Generic.SlowingBreath).effects;
    expect(modern.changes.map((c: any) => c.key)).toEqual([
      "system.attributes.movement.multiplier",
      "system.abilities.dex.save.roll.mode",
    ]);
    expect(modern.midiChanges).toBeUndefined();
    const [legacy] = build(MonsterEnrichers.Generic.SlowingBreath, { is2014: true }).effects;
    expect(legacy.changes.map((c: any) => c.key)).toEqual(["system.attributes.movement.multiplier"]);
  });

  it("Weakening Breath and Supreme Discipline (Potence) use the per-ability attack roll mode", () => {
    const [weakened] = build(MonsterEnrichers.Generic.WeakeningBreath).effects;
    expect(weakened.changes.map((c: any) => [c.key, c.value])).toEqual([
      ["system.abilities.str.attack.roll.mode", "-1"],
      ["system.abilities.str.check.roll.mode", "-1"],
      ["system.abilities.str.save.roll.mode", "-1"],
    ]);
    expect(weakened.midiChanges).toBeUndefined();

    const [potence] = build(FeatEnrichers.SupremeDisciplinePotence).effects;
    expect(potence.changes).toEqual([
      { key: "system.abilities.str.attack.roll.mode", value: "1", type: "add", priority: 20 },
    ]);
    expect(potence.midiChanges).toBeUndefined();
    expect(potence.ac5eChanges).toBeUndefined();
  });

  it("Hybrid Transformation no longer duplicates its native Strength modes on the module channels", () => {
    const enricher = build(ClassEnrichers.BloodHunter.HybridTransformation);
    const hybrid = enricher._hybridFormEffect(1, "abcdefabcdefabcd");
    const keys = hybrid.changes.map((c: any) => c.key);
    expect(keys).toContain("system.abilities.str.check.roll.mode");
    expect(keys).toContain("system.abilities.str.save.roll.mode");
    expect(hybrid.midiChanges).toBeUndefined();
    expect(hybrid.ac5eChanges).toBeUndefined();
  });
});

describe("whole-duration attack modes become native attack rules", () => {
  const cases: [string, () => THint, "1" | "-1"][] = [
    ["bard Nimbus of Pathos", () => build(ClassEnrichers.Bard.NimbusOfPathos).effects[0], "1"],
    ["cleric Plucking at Threads", () => build(ClassEnrichers.Cleric.PluckingAtThreads, { isAction: true }).effects[0], "1"],
    ["druid Future Sight", () => build(ClassEnrichers.Druid.FutureSight).effects[0], "1"],
    ["paladin Encouraging Smite", () => build(ClassEnrichers.Paladin.EncouragingSmite).effects[0], "1"],
    ["paladin Valorous Soul", () => build(ClassEnrichers.Paladin.ValorousSoul).effects[0], "1"],
    ["barbarian Zealous Presence", () => build(ClassEnrichers.Barbarian.ZealousPresence).effects[0], "1"],
    ["blood hunter Souleater", () => build(ClassEnrichers.BloodHunter.BloodCurseOfTheSouleater).effects[0], "1"],
    ["blood hunter Souleater (Amplified)", () => build(ClassEnrichers.BloodHunter.BloodCurseOfTheSouleater).effects[1], "1"],
    ["True Strike (2014)", () => build(SpellEnrichers.TrueStrike, { is2014: true }).effects[0], "1"],
    ["cleric Skein Weaver", () => build(ClassEnrichers.Cleric.SkeinWeaver).effects[0], "-1"],
    ["warlock Context Switch", () => build(ClassEnrichers.Warlock.ContextSwitch, { isAction: true }).effects[0], "-1"],
    ["Slasher: Enhanced Critical", () => build(FeatEnrichers.Slasher).effects.find((e: any) => e.name === "Slashed: Enhanced Critical"), "-1"],
    ["monster Bard Taunt", () => build(MonsterEnrichers.Bard.Taunt).effects[0], "-1"],
    ["ratatosk War Chatter", () => build(TraitEnrichers.Ratatosk.WarChatter, { isAction: true }).effects[0], "-1"],
    ["barbarian Maddening Fumes", () => build(ClassEnrichers.Barbarian.AugmentationCompoundsMaddeningFumes).effects[0], "-1"],
    ["Strike of the Giants: Storm Strike", () => build(FeatEnrichers.StrikeOfTheGiants, { name: "Strike of the Giants: Storm Strike", isAction: true }).effects.find((e: any) => e.name.startsWith("Storm Struck")), "-1"],
    ["warlock Crown of Horns: Wickedness", () => build(ClassEnrichers.Warlock.CrownOfHorns, { name: "Crown of Horns", actions: null }).effects[2], "-1"],
    ["Symbol: Discord (2014)", () => build(SpellEnrichers.Symbol, { is2014: true }).effects.find((e: any) => e.name === "Discord"), "-1"],
    ["Symbol: Discord (2024)", () => build(SpellEnrichers.Symbol).effects.find((e: any) => e.name === "Discord"), "-1"],
    ["Irresistible Dance (2014)", () => build(SpellEnrichers.IrresistibleDance, { is2014: true }).effects[0], "-1"],
    ["Irresistible Dance (2024)", () => build(SpellEnrichers.IrresistibleDance).effects[1], "-1"],
  ];

  it.each(cases)("%s carries one unconditional attack rule and no self-side module flag", (_label, hintFor, value) => {
    const hint = hintFor();
    expect(hint).toBeDefined();
    expectAttackRule(hint, value);
  });

  it("carries the matching save, check and d20 rules where the feature names them", () => {
    const rule = (hint: THint, key: string) => hint.changes.find((c: any) => c.key === key && c.type === "dnd5e.advantage");
    expect(rule(build(ClassEnrichers.Bard.NimbusOfPathos).effects[0], "save")).toMatchObject({ value: "1" });
    expect(rule(build(ClassEnrichers.Cleric.PluckingAtThreads, { isAction: true }).effects[0], "save")).toMatchObject({ value: "1" });
    expect(rule(build(ClassEnrichers.Cleric.SkeinWeaver).effects[0], "save")).toMatchObject({ value: "-1" });
    expect(rule(build(ClassEnrichers.Warlock.CrownOfHorns, { name: "Crown of Horns", actions: null }).effects[2], "check")).toMatchObject({ value: "-1" });
    // "Disadvantage on all D20 Tests" is the d20 category, covering attacks, checks and saves
    const harbinger = build(ClassEnrichers.Warlock.HarbingerOfChaos, { isAction: true }).effects[0];
    expect(harbinger.changes).toEqual([{ key: "d20", value: "-1", type: "dnd5e.advantage", priority: 20 }]);
    expect(midiKeys(harbinger)).toEqual(["flags.midi-qol.grants.advantage.attack.all"]);
  });

  it("keeps the grants-side half of a paired effect on the module channels", () => {
    const futureSight = build(ClassEnrichers.Druid.FutureSight).effects[0];
    expect(midiKeys(futureSight)).toEqual(["flags.midi-qol.grants.disadvantage.attack.all"]);
    expect(ac5eChanges(futureSight).map((c) => c.key)).toEqual(["flags.automated-conditions-5e.grants.attack.disadvantage"]);

    for (const dance of [build(SpellEnrichers.IrresistibleDance, { is2014: true }).effects[0], build(SpellEnrichers.IrresistibleDance).effects[1]]) {
      expect(midiKeys(dance)).toEqual(["flags.midi-qol.grants.advantage.attack.all"]);
    }
  });
});

describe("scoped attack modes", () => {
  const meleeWeapon = [
    { k: "roll.attack.classification", o: "exact", v: "weapon" },
    { k: "roll.attack.type", o: "exact", v: "melee" },
  ];

  it("Reckless Attack uses the Strength attack roll mode and keeps the incoming half on the modules", () => {
    const [reckless] = build(GenericEnrichers.RecklessAttack).effects;
    expect(reckless.changes).toEqual([
      { key: "system.abilities.str.attack.roll.mode", value: "1", type: "add", priority: 20 },
    ]);
    expect(midiKeys(reckless)).toEqual(["flags.midi-qol.grants.advantage.attack.all"]);
    expect(ac5eChanges(reckless).map((c) => c.key)).toEqual(["flags.automated-conditions-5e.grants.attack.advantage"]);
  });

  it("Reckless Tactics and Iron Punisher gate their attack advantage on melee weapon attacks", () => {
    for (const hint of [
      build(ClassEnrichers.Bard.RecklessTactics).effects[0],
      build(ClassEnrichers.Fighter.IronPunisher).effects[0],
    ]) {
      expectAttackRule(hint, "1", meleeWeapon);
      expect(midiKeys(hint)).toEqual(["flags.midi-qol.grants.advantage.attack.all"]);
    }
    // the stance stays a disabled transfer toggle
    expect(build(ClassEnrichers.Fighter.IronPunisher).effects[0].options).toMatchObject({ transfer: true, disabled: true });
  });

  it("Frostbite gates its disadvantage on weapon attacks and keeps both one-use tokens", () => {
    const [frostbitten] = build(SpellEnrichers.Frostbite).effects;
    expectAttackRule(frostbitten, "-1", { k: "roll.attack.classification", o: "exact", v: "weapon" });
    expect(frostbitten.noCreate).toBe(true);
    expect(frostbitten.daeSpecialDurations).toEqual(["1Attack:rwak", "1Attack:mwak"]);
    expect(ac5eChanges(frostbitten)).toEqual([
      expect.objectContaining({
        key: "flags.automated-conditions-5e.attack.disadvantage",
        value: "once; actionType.mwak || actionType.rwak",
      }),
    ]);
  });
});

describe("one-use attack modes keep their consumption tokens beside the native rule", () => {
  const cases: [string, () => THint, "1" | "-1", string[] | undefined, string | undefined][] = [
    ["druid Moonlight Step", () => build(ClassEnrichers.Druid.MoonlightStep).effects[0], "1", ["1Attack"], "turnEnd"],
    ["fighter Feinting Attack", () => build(ClassEnrichers.Fighter.ManeuverFeintingAttack).effects[0], "1", ["1Attack"], undefined],
    ["rogue Steady Aim", () => build(ClassEnrichers.Rogue.SteadyAim, { isAction: true }).effects[0], "1", ["1Attack"], "turnEnd"],
    ["Lords' Alliance Agent", () => build(FeatEnrichers.LordsAllianceAgent).effects[0], "1", ["1Attack"], undefined],
    ["cleric Blessed Chosen", () => build(ClassEnrichers.Cleric.BlessedChosen, { isAction: true }).effects[0], "-1", undefined, "turnEnd"],
    ["cleric Ward of Shadows", () => build(ClassEnrichers.Cleric.WardOfShadows, { isAction: true }).effects[0], "-1", undefined, "turnEnd"],
    ["Chattering Staff of Skulls", () => build(ItemEnrichers.StaffOfSkulls, { name: "Chattering Staff of Skulls" }).effects[0], "-1", undefined, "targetEnd"],
    ["Vicious Mockery", () => build(SpellEnrichers.ViciousMockery).effects[0], "-1", ["1Attack"], "targetEnd"],
  ];

  it.each(cases)("%s", (_label, hintFor, value, daeTokens, expiry) => {
    const hint = hintFor();
    expectAttackRule(hint, value);
    const direction = value === "1" ? "advantage" : "disadvantage";
    // AC5e's once deletes the effect after the first matching roll
    expect(ac5eChanges(hint)).toEqual([
      expect.objectContaining({ key: `flags.automated-conditions-5e.attack.${direction}`, value: "once; 1" }),
    ]);
    if (daeTokens) expect(hint.daeSpecialDurations).toEqual(daeTokens);
    if (expiry) expect(hint.options.expiry).toBe(expiry);
    // every one-use hint states the module-free ceiling
    expect(hint.options.description).toMatch(/Without (DAE or )?AC5e/);
  });

  it("Feinting Attack no longer hides its native damage bonus behind midiOnly", () => {
    const [feint] = build(ClassEnrichers.Fighter.ManeuverFeintingAttack).effects;
    expect(feint.midiOnly).toBeUndefined();
    expect(feint.changes.map((c: any) => c.key)).toEqual([
      "attack",
      "system.rolls.damage.mwak.bonus",
      "system.rolls.damage.rwak.bonus",
    ]);
  });

  it("Vicious Mockery collapsed its midi-only twin into the one native effect", () => {
    expect(build(SpellEnrichers.ViciousMockery).effects).toHaveLength(1);
  });
});
