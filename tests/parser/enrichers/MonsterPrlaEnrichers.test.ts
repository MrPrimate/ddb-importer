/**
 * Pins for the Project_Lamordia (PrLa) monster enrichers and the generics added with them. Three
 * of the per-monster features share a name with an unrelated monster's feature (Lightning Rod,
 * Malfunction, Syringe), so the monsters manifest cannot lock their enricher; the routing is
 * pinned here instead. Wording here is synthetic.
 *
 * No vi.mock preamble, for the reasons given in ClassEnrichers.test.ts.
 */
// The enricher barrel loads first: importing DDBMonsterFeatureEnricher directly re-enters the
// enricher tree mid-evaluation and DDBGenericEnricher extends an undefined mixin.
import { DDBMonsterFeatureEnricher, MonsterEnrichers } from "../../../src/parser/enrichers/_module";
import { makeEnricherData } from "../../_fixtures/ddb/factories";
import { installActivityConfigStubs } from "../../_fixtures/ddb/stubs";

beforeAll(() => installActivityConfigStubs());

type TEnricher = new (options: any) => any;

function feature(Enricher: TEnricher, name: string, text: string): any {
  const e: any = makeEnricherData(Enricher, {
    name,
    actions: null,
    ddbParser: { strippedHtml: text, actionData: { damageParts: [] } },
  });
  e.document = { system: { activities: {} }, effects: [] };
  return e;
}

function extra(e: any, name: string): any {
  const found = (e.additionalActivities ?? []).find((a: any) => a.init?.name === name);
  if (!found) throw new Error(`no activity named "${name}"`);
  return found;
}

describe("routing", () => {
  const enricher = new DDBMonsterFeatureEnricher({
    activityGenerator: null as unknown as TActivityGenerator,
  });
  const monsterHint = (monster: string) => Object.keys(enricher.MONSTER_NAME_HINT_INCLUDES)
    .find((key) => monster.includes(key));

  it("sends both printings of Viktra to one folder, and nobody else", () => {
    expect(monsterHint("Viktra Mordenheim")).toBe("Viktra Mordenheim");
    expect(monsterHint("CEO Viktra Mordenheim")).toBe("Viktra Mordenheim");
    expect(monsterHint("Injector")).toBeUndefined();
    expect(monsterHint("Paralititan (Magical Variant)")).toBeUndefined();
  });

  it.each([
    ["ViktraMordenheim", "Syringe"],
    ["ViktraMordenheim", "LightningRod"],
    ["ViktraMordenheim", "BolsterInventions"],
    ["Created", "Malfunction"],
    ["HendrikVonAubrecker", "NumbingNeedle"],
  ])("the barrel exposes %s.%s", (monster, name) => {
    const group = (MonsterEnrichers as unknown as Record<string, Record<string, unknown>>)[monster];
    expect(typeof group[name]).toBe("function");
  });

  it.each([
    ["X-Ray Scanning", "X-Ray Scanning", MonsterEnrichers.Generic.XRayScanning],
    ["Darklord Restoration", "Darklord Restoration", MonsterEnrichers.Generic.DarklordRestoration],
    ["Bloodied Fury", "Bloodied Fury", MonsterEnrichers.Generic.BloodiedFury],
    ["Bloodied Frenzy", "Bloodied Fury", MonsterEnrichers.Generic.BloodiedFury],
  ])("routes %s to the generic %s enricher", (name, hint, Enricher) => {
    expect(enricher._genericFeatureHint(name)).toBe(hint);
    expect(enricher.GENERIC_ENRICHERS[hint]).toBe(Enricher);
  });
});

describe("Syringe", () => {
  const text = "Constitution Saving Throw: DC 12, one creature within 5 feet. Failure: The target has the Poisoned "
    + "condition for 1 minute and suffers one serum. Corrosive Serum. The target takes 5 (2d4) Acid damage at the "
    + "start of each of its turns, and its Speed decreases by 15 feet. Deadly Serum. The target takes 6 (1d10) "
    + "Necrotic damage at the start of each of its turns. Mind-Altering Serum. The target takes 7 (2d6) Psychic "
    + "damage at the start of each of its turns.";
  const e = feature(MonsterEnrichers.ViktraMordenheim.Syringe, "Syringe", text);

  it("keeps the save free of serum damage", () => {
    expect(e.clearAutoEffects).toBe(true);
    // one serum's effect is applied: Midi prompts rather than applying all three
    expect(e.activity).toEqual({ name: "Syringe", removeDamageParts: true, data: { midiProperties: { chooseEffects: true } } });
  });

  it("rolls each serum's damage at the start of the target's turn", () => {
    expect(e.additionalActivities.map((a: any) => a.init.name)).toEqual([
      "Corrosive Serum Damage", "Deadly Serum Damage", "Mind-Altering Serum Damage",
    ]);
    const corrosive = extra(e, "Corrosive Serum Damage");
    expect(corrosive.init.type).toBe("damage");
    expect(corrosive.build.activationOverride.type).toBe("turnStart");
    expect(corrosive.build.damageParts).toEqual([expect.objectContaining({ number: 2, denomination: 4, types: ["acid"] })]);
    expect(corrosive.overrides).toMatchObject({ noConsumeTargets: true, noeffect: true });
  });

  it("makes each serum its own Poisoned effect on the save", () => {
    const [corrosive, deadly, mind] = e.effects;
    for (const effect of e.effects) {
      expect(effect).toMatchObject({ statuses: ["Poisoned"], activityMatch: "Syringe", options: { durationSeconds: 60 } });
    }
    expect(corrosive.name).toBe("Poisoned: Corrosive Serum");
    expect(corrosive.changes).toEqual([expect.objectContaining({ key: "system.attributes.movement.bonus", value: "-15" })]);
    expect(deadly.changes).toEqual([expect.objectContaining({ key: "system.traits.di.value", value: "healing" })]);
    expect(mind.changes).toEqual([expect.objectContaining({ key: "system.attributes.concentration.roll.mode" })]);
  });
});

describe("Malfunction", () => {
  const text = "The test golem rolls 1d4: 1: Insect Hive. Constitution Saving Throw: DC 11, each creature within 10 "
    + "feet. Failure: 4 (1d8) Poison damage, and the creature has the Poisoned condition until the start of its next "
    + "turn. 2: Melting Plastic. Dexterity Saving Throw: DC 11, each creature in a 15-foot Cone. Failure: 4 (1d8) "
    + "Fire damage, and the target's Speed is halved until the end of its next turn. Success: Half damage only. "
    + "3: Electrical Discharge. Dexterity Saving Throw: DC 11, each creature within 10 feet. Failure: 9 (2d8) "
    + "Lightning damage. Success: Half damage. 4: Haywire. The test golem makes two attacks.";
  const e = feature(MonsterEnrichers.Created.Malfunction, "Malfunction", text);

  it("spends the recharge on a table roll", () => {
    expect(e.type).toBe("utility");
    expect(e.activity.data.roll).toMatchObject({ formula: "1d4" });
  });

  it("builds every result as a free activity with its own area", () => {
    expect(e.additionalActivities.map((a: any) => a.init.name)).toEqual([
      "Insect Hive", "Melting Plastic", "Electrical Discharge", "Haywire",
    ]);
    for (const activity of e.additionalActivities) expect(activity.overrides.noConsumeTargets).toBe(true);
    expect(extra(e, "Insect Hive").build.targetOverride.template).toMatchObject({ type: "radius", size: "10" });
    expect(extra(e, "Insect Hive").build.onSave).toBe("none");
    expect(extra(e, "Melting Plastic").build.targetOverride.template).toMatchObject({ type: "cone", size: "15" });
    expect(extra(e, "Melting Plastic").build.onSave).toBe("half");
    expect(extra(e, "Electrical Discharge").build.onSave).toBe("half");
    expect(extra(e, "Haywire").init.type).toBe("utility");
  });

  it("links only the results with a rider to an effect", () => {
    expect(extra(e, "Insect Hive").overrides.noeffect).toBeUndefined();
    expect(extra(e, "Melting Plastic").overrides.noeffect).toBeUndefined();
    expect(extra(e, "Electrical Discharge").overrides.noeffect).toBe(true);
    expect(extra(e, "Haywire").overrides.noeffect).toBeUndefined();
    expect(e.effects.map((effect: any) => [effect.name, effect.activityMatch, effect.options.expiry])).toEqual([
      ["Insect Hive: Poisoned", "Insect Hive", "targetStart"],
      ["Melting Plastic: Slowed", "Melting Plastic", "targetEnd"],
      ["Haywire: Berserk", "Haywire", undefined],
    ]);
  });

  it("marks Haywire's minute of berserk rolls on the created", () => {
    expect(extra(e, "Haywire").build.targetOverride.affects.type).toBe("self");
    expect(e.effects.find((effect: any) => effect.name === "Haywire: Berserk").options.durationSeconds).toBe(60);
  });
});

describe("generics", () => {
  it("X-Ray Scanning upgrades Blindsight for the stated time", () => {
    const e = feature(MonsterEnrichers.Generic.XRayScanning, "X-Ray Scanning",
      "The test hound gains Blindsight to a range of 30 feet. This benefit lasts for 10 minutes or until it has the Blinded condition.");
    expect(e.activity).toEqual({ targetType: "self", noTemplate: true });
    expect(e.effects).toEqual([expect.objectContaining({
      name: "X-Ray Scanning",
      options: expect.objectContaining({ durationSeconds: 600 }),
      changes: [expect.objectContaining({ key: "system.attributes.senses.ranges.blindsight", value: "30" })],
    })]);
  });

  it("Darklord Restoration reads a return time in weeks", () => {
    const e = feature(MonsterEnrichers.Generic.DarklordRestoration, "Darklord Restoration",
      "If the test darklord dies, it revives with all its Hit Points in 2d6 weeks somewhere in its domain.");
    expect(e.activity.data.roll).toMatchObject({ formula: "2d6", name: "Weeks to Return" });
  });

  it("Bloodied Frenzy gives attack and save advantage while Bloodied", () => {
    const e = feature(MonsterEnrichers.Generic.BloodiedFury, "Bloodied Frenzy",
      "While Bloodied, the test raider has Advantage on attack rolls and saving throws.");
    const [effect] = e.effects;
    expect(effect.options).toMatchObject({ transfer: true, durationSeconds: null, expiry: null });
    // dnd5e 5.x has no rule changes: AC5e reads the roller's own Bloodied status
    expect(effect.ac5eChanges.map((change: any) => [change.key, change.value])).toEqual([
      ["flags.automated-conditions-5e.attack.advantage", "rollingActor.statuses.bloodied"],
      ["flags.automated-conditions-5e.save.advantage", "rollingActor.statuses.bloodied"],
    ]);
  });

  it("Bloodied Fury scopes a melee-only advantage", () => {
    const e = feature(MonsterEnrichers.Generic.BloodiedFury, "Bloodied Fury",
      "The test beast has Advantage on melee attack rolls while it is Bloodied.");
    const [effect] = e.effects;
    expect(effect.ac5eChanges).toHaveLength(1);
    expect(effect.ac5eChanges[0].value).toBe("rollingActor.statuses.bloodied && (mwak || msak)");
  });
});

describe("small riders", () => {
  it("Lightning Rod stops reactions until the target's turn starts", () => {
    const e = feature(MonsterEnrichers.ViktraMordenheim.LightningRod, "Lightning Rod", "");
    expect(e.effects).toEqual([expect.objectContaining({
      name: "Lightning Rod: No Reactions",
      options: expect.objectContaining({ expiry: "targetStart" }),
      ac5eChanges: [expect.objectContaining({ key: "flags.automated-conditions-5e.use.fail", type: "ac5e", value: "activity.activation.type === 'reaction'; description=No Reactions" })],
      midiChanges: [expect.objectContaining({ key: "flags.midi-qol.noReaction" })],
    })]);
  });

  it("Numbing Needle replaces the half-speed effect with one slowed effect", () => {
    const e = feature(MonsterEnrichers.HendrikVonAubrecker.NumbingNeedle, "Numbing Needle", "");
    expect(e.clearAutoEffects).toBe(true);
    expect(e.effects).toEqual([expect.objectContaining({
      name: "Numbing Needle: Slowed",
      changes: [expect.objectContaining({ key: "system.attributes.movement.all", value: "/2" })],
      ac5eChanges: [expect.objectContaining({ key: "flags.automated-conditions-5e.use.fail", type: "ac5e", value: "activity.activation.type === 'reaction'; description=No Reactions" })],
      midiChanges: [expect.objectContaining({ key: "flags.midi-qol.noReaction" })],
    })]);
  });

  it("Bolster Inventions heals allies around the monster at the end of its turn", () => {
    const e = feature(MonsterEnrichers.ViktraMordenheim.BolsterInventions, "Bolster Inventions",
      "At the end of each of the test inventor's turns, each of her Construct allies in a 10-foot Emanation originating from her gains 3 Temporary Hit Points.");
    expect(e.type).toBe("heal");
    expect(e.activity).toMatchObject({ activationType: "turnEnd", rangeSelf: true });
    expect(e.activity.data.healing).toMatchObject({ bonus: "3", types: ["temphp"] });
    expect(e.activity.data.target.affects.type).toBe("ally");
    expect(e.activity.data.target.template).toMatchObject({ type: "radius", size: "10" });
  });
});
