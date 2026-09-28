// The enricher barrel loads first: importing DDBMonsterFeatureEnricher directly re-enters the
// enricher tree mid-evaluation and DDBGenericEnricher extends an undefined mixin.
import { MonsterEnrichers } from "../../../src/parser/enrichers/_module";
import {
  parseAllSelfResistances,
  parseBenefitRiders,
  parseConditionImmunities,
  parseGrantedResistance,
  parseResistanceDuration as parseSelfDuration,
  parseSelfResistance,
} from "../../../src/parser/enrichers/monster/Generic/_ResistanceText";
import { makeEnricherData } from "../../_fixtures/ddb/factories";
import { installActivityConfigStubs } from "../../_fixtures/ddb/stubs";

const SelfResistance = MonsterEnrichers.Generic.SelfResistance;
const ShapeShift = MonsterEnrichers.Generic.ShapeShift;
const GrantResistance = MonsterEnrichers.Generic.GrantResistance;
const FormResistance = MonsterEnrichers.Generic.FormResistance;

beforeAll(() => installActivityConfigStubs());

function feature(name: string, text: string): InstanceType<typeof SelfResistance> {
  const e = makeEnricherData(SelfResistance, {
    name,
    actions: null,
    ddbParser: { strippedHtml: text, actionData: { damageParts: [] } },
  });
  e.document = { system: { activities: {} }, effects: [] };
  return e;
}

const PHYSICAL = ["bludgeoning", "piercing", "slashing"];

describe("self resistance text", () => {
  it("reads resistance to all damage and a self status in the same sentence", () => {
    const grant = parseSelfResistance(
      "The test turtle pulls into its shell. Until it takes its Unfold action, it has resistance to all damage, and it is restrained.",
    );
    expect(grant?.trait).toBe("dr");
    expect(grant?.types).toHaveLength(13);
    expect(grant?.statuses).toEqual(["Restrained"]);
    expect(grant?.nonmagical).toBe(false);
  });

  it("reads a listed set of types and the nonmagical bypass", () => {
    const grant = parseSelfResistance(
      "When the test golem is attacked, it gains resistance to bludgeoning, piercing, and slashing damage from nonmagical attacks until the end of the attacker's turn.",
    );
    expect(grant?.types).toEqual(PHYSICAL);
    expect(grant?.nonmagical).toBe(true);
  });

  it("reads a list item that runs on without a full stop", () => {
    const grant = parseSelfResistance(
      "He deals an extra 2 damage when he hits a target with a melee attack (included in attacks) He has resistance to bludgeoning, piercing, and slashing damage He can't be frightened",
    );
    expect(grant?.types).toEqual(PHYSICAL);
  });

  it("reads immunity", () => {
    expect(parseSelfResistance("While shifted, the test wisp has immunity to fire damage.")?.trait).toBe("di");
  });

  it("ignores a grant to another creature", () => {
    expect(parseSelfResistance("Each ally within 10 feet of the test captain has resistance to all damage.")).toBeNull();
    expect(parseSelfResistance("The target has resistance to cold damage until the end of its next turn.")).toBeNull();
  });

  it("reads an or-list as a choice", () => {
    const grant = parseSelfResistance("The test mage has resistance to acid, cold, or fire damage.");
    expect(grant).toMatchObject({ choice: true, types: ["acid", "cold", "fire"] });
  });

  it("reads a picked type with its options later in the sentence or elsewhere in the feature", () => {
    expect(parseSelfResistance(
      "The test drake gains resistance to one damage type of its choice - acid, fire, or thunder - until the start of its next turn.",
    )).toMatchObject({ choice: true, types: ["acid", "fire", "thunder"] });
    expect(parseSelfResistance(
      "At the start of each of its turns, the test brewer chooses one of the following damage types: cold or poison. The brewer has resistance to that damage type until the start of its next turn.",
    )).toMatchObject({ choice: true, types: ["cold", "poison"] });
    expect(parseSelfResistance("The test golem has resistance to the type of damage dealt by that weapon.")?.types)
      .toEqual(PHYSICAL);
    expect(parseSelfResistance("Response: The test stalker has resistance to the triggering damage.")?.types)
      .toHaveLength(13);
  });

  it("ignores a choice of one, a stat block's fixed trait", () => {
    expect(parseSelfResistance("The test husk has immunity to a type of damage based on its maker: fire (red).")).toBeNull();
  });

  it("ignores resistance with no stated type", () => {
    expect(parseSelfResistance("The test shade has resistance to damage while in darkness.")).toBeNull();
  });

  it("reads next-turn edges as target pseudo expiries", () => {
    expect(parseSelfDuration("It has resistance to all damage until the start of its next turn.")).toEqual({
      seconds: null, expiry: "targetStart", concentration: false,
    });
    expect(parseSelfDuration("He gains resistance to fire damage until the end of his next turn.").expiry).toBe("targetEnd");
    expect(parseSelfDuration("until the end of the attacker's turn").expiry).toBe("turnEnd");
  });

  it("reads counted durations and concentration", () => {
    expect(parseSelfDuration("The test brute enters a rage that lasts 1 minute.").seconds).toBe(60);
    expect(parseSelfDuration("It changes shape for 10 minutes (as if concentrating on a spell).")).toEqual({
      seconds: 600, expiry: null, concentration: true,
    });
    expect(parseSelfDuration("Until it chooses to end it.")).toEqual({ seconds: null, expiry: null, concentration: false });
  });
});

function build<T extends { document: unknown }>(Enricher: new (options: any) => T, name: string, text: string): T {
  const e = makeEnricherData(Enricher, {
    name,
    actions: null,
    ddbParser: { strippedHtml: text, actionData: { damageParts: [] } },
  });
  e.document = { system: { activities: {} }, effects: [] };
  return e;
}

describe("generic monster self resistance", () => {
  it("makes an open-ended self enchantment that renames itself Deactivate", () => {
    const e = feature(
      "Retract",
      "The test turtle pulls into its shell. Until it takes its Unfold action, it has resistance to all damage, and it is restrained.",
    );
    expect(e.type).toBe("enchant");
    expect(e.activity).toMatchObject({ targetSelf: true, data: { enchant: { self: true } } });
    expect(e.activity?.data?.duration).toBeUndefined();
    const [rider, enchantment] = e.effects;
    expect(rider).toMatchObject({
      statuses: ["Restrained"],
      options: { transfer: true, durationSeconds: null, expiry: null },
      data: { _id: "ddbSelfResRdr001" },
    });
    expect(rider.changes).toHaveLength(13);
    expect(rider.changes?.[0]).toMatchObject({ key: "system.traits.dr.value", type: "add" });
    expect(rider.activityTypesMatch).toBeUndefined();
    expect(enchantment).toMatchObject({
      type: "enchant",
      activityTypesMatch: ["enchant"],
      options: { durationSeconds: null },
      data: { _id: "ddbSelfResEnc001", flags: { ddbimporter: { effectRiders: ["ddbSelfResRdr001"] } } },
    });
    const renamed = enchantment.changes?.find((c: IActiveEffectChangeData) => c.key === "activities[enchant].name");
    expect(renamed?.value).toBe("Deactivate");
    expect(enchantment.options?.description).toMatch(/Deactivate/);
  });

  it("lets a counted duration expire the enchantment and keeps the activity name", () => {
    const e = feature(
      "Rage",
      "The test brute enters a rage that lasts for 1 minute. It has advantage on Strength checks and Strength saving throws. It deals an extra 3 damage with melee weapon attacks. It has resistance to bludgeoning, piercing, and slashing damage.",
    );
    expect(e.activity?.data?.duration).toEqual({ override: true, value: "1", units: "minute", concentration: false });
    const [rider, enchantment] = e.effects;
    const keys = rider.changes?.map((c: IActiveEffectChangeData) => c.key);
    expect(keys).toContain("system.abilities.str.check.roll.mode");
    expect(keys).toContain("system.abilities.str.save.roll.mode");
    expect(enchantment.options?.durationSeconds).toBe(60);
    expect(enchantment.changes?.some((c: IActiveEffectChangeData) => c.key === "activities[enchant].name")).toBe(false);
  });

  it("offers one enchantment and rider per picked type", () => {
    const e = feature(
      "Chromatic Resistance",
      "The test drake gains resistance to one damage type of its choice - acid, fire, or thunder - until the start of its next turn.",
    );
    const effects = e.effects;
    expect(effects).toHaveLength(6);
    const enchantments = effects.filter((effect: IDDBEffectHint) => effect.type === "enchant");
    expect(enchantments.map((effect: IDDBEffectHint) => effect.name)).toEqual([
      "Chromatic Resistance: Acid Resistance",
      "Chromatic Resistance: Fire Resistance",
      "Chromatic Resistance: Thunder Resistance",
    ]);
    expect(enchantments[1]).toMatchObject({
      options: { expiry: "targetStart" },
      data: { flags: { ddbimporter: { effectRiders: ["ddbSelfResRdr002"] } } },
    });
    expect(effects[2].changes).toEqual([expect.objectContaining({ key: "system.traits.dr.value", value: "fire" })]);
  });

  it("leaves healing in the text to the parser's heal activity", () => {
    const e = feature(
      "Rally",
      "The test captain regains 20 hit points, and he gains resistance to bludgeoning, piercing, and slashing damage until the end of his next turn.",
    );
    expect(e.type).toBe("enchant");
    expect(e.additionalActivities).toEqual([]);
    expect(e.effects[1]).toMatchObject({ options: { expiry: "targetEnd" } });
  });

  it("offers damage dealt to others only while active", () => {
    const e = feature(
      "Panic Shift",
      "When the test mimic takes damage, it becomes a spiked ball. While in this form, it has resistance to bludgeoning, piercing, and slashing damage, and a creature that touches it takes 10 (3d6) piercing damage.",
    );
    expect(e.activity).toMatchObject({ removeDamageParts: true });
    expect(e.additionalActivities).toHaveLength(1);
    expect(e.additionalActivities[0].init).toEqual({ name: "Damage", id: "ddbSelfResDmg001", type: "damage" });
    expect(e.effects[1].data?.flags?.ddbimporter?.activityRiders).toEqual(["ddbSelfResDmg001"]);
  });

  it("leaves a shared name without a self grant to the parser", () => {
    const e = feature("Enlarge", "For 1 minute, the test dwarf magically increases in size, along with anything it is wearing.");
    expect(e.type).toBeNull();
    expect(e.activity).toBeNull();
    expect(e.additionalActivities).toEqual([]);
    expect(e.effects).toEqual([]);
  });
});

describe("self-buff benefit riders", () => {
  const keys = (text: string, size: string | null = null) =>
    parseBenefitRiders(text, { size }).changes.map((c) => `${c.key}=${c.value}`);

  it("reads melee and weapon damage bonuses, skipping ones already in the attacks", () => {
    expect(keys("When it makes a melee weapon attack, the test giant gains a +4 bonus to the damage roll."))
      .toEqual(["system.rolls.damage.mwak.bonus=4"]);
    expect(keys("He deals an extra 3 damage when he hits a target with a melee weapon attack."))
      .toEqual(["system.rolls.damage.mwak.bonus=3"]);
    expect(keys("He deals an extra 4 damage when he hits a target with a melee weapon attack (included in attacks)"))
      .toEqual([]);
    expect(keys("She has a +2 bonus to weapon damage rolls."))
      .toEqual(["system.rolls.damage.mwak.bonus=2", "system.rolls.damage.rwak.bonus=2"]);
  });

  it("reads a named size and one size up for enlarge", () => {
    expect(keys("Her size becomes Large.", "med")).toEqual(["system.traits.size=lg"]);
    expect(keys("The test brute casts enlarge/reduce on himself to grow in size.", "med")).toEqual(["system.traits.size=lg"]);
    expect(keys("The test brute casts enlarge/reduce on himself.", null)).toEqual([]);
  });

  it("reads attack advantage, condition immunity, fly speed, stealth and doubled speeds", () => {
    const changes = keys("It has advantage on attack rolls. He can't be charmed or frightened. He has a flying speed of 60 feet. He has advantage on Dexterity (Stealth) checks. Its walking and climbing speeds are doubled.");
    expect(changes).toEqual(expect.arrayContaining([
      "system.traits.ci.value=charmed",
      "system.traits.ci.value=frightened",
      "system.attributes.movement.speeds.fly=60",
      "system.attributes.movement.speeds.walk=2",
      "system.attributes.movement.speeds.climb=2",
    ]));
    expect(changes.some((c) => c.startsWith("system.rolls.attack"))).toBe(true);
    expect(changes.some((c) => c.startsWith("system.skills.ste.roll.mode"))).toBe(true);
  });

  it("turns attacks against the monster into AC5e and midi grants only", () => {
    const riders = parseBenefitRiders("Attack rolls made against the frenzied test bear have advantage.");
    expect(riders.changes).toEqual([]);
    expect(riders.ac5eChanges[0]).toMatchObject({ key: "flags.automated-conditions-5e.grants.attack.advantage" });
    expect(riders.midiChanges[0]).toMatchObject({ key: "flags.midi-qol.grants.advantage.attack.all" });
    expect(parseBenefitRiders("Attacks against the test giant are made at disadvantage.").ac5eChanges[0])
      .toMatchObject({ key: "flags.automated-conditions-5e.grants.attack.disadvantage" });
  });

  it("puts the riders on the rider effect and adds a teleport activity", () => {
    const e = feature(
      "Blessing",
      "The test witch teleports up to 30 feet to an unoccupied space it can see. Until the start of its next turn, it gains resistance to all damage, and attacks against it are made at disadvantage.",
    );
    expect(e.additionalActivities[0]).toMatchObject({
      init: { name: "Teleport", id: "ddbSelfResTele01", type: "teleport" },
      build: { rangeOverride: { value: "30" } },
    });
    expect(e.effects[0].ac5eChanges?.[0]).toMatchObject({ key: "flags.automated-conditions-5e.grants.attack.disadvantage" });
  });
});

describe("generic monster grant resistance", () => {
  it("reads a grant to another creature with its status", () => {
    expect(parseGrantedResistance(
      "While sealed, a test ooze has the paralyzed condition, it has immunity to all damage.",
    )).toMatchObject({ trait: "di", statuses: ["Paralyzed"] });
  });

  it("makes a creature-targeted utility with one effect per triggering type", () => {
    const e = build(GrantResistance, "Devotion", "Trigger: An ally within 5 feet takes damage. Response: The ally gains Resistance to the triggering damage.");
    expect(e.type).toBe("utility");
    expect(e.activity).toMatchObject({ name: "Grant Resistance", targetType: "creature" });
    expect(e.effects).toHaveLength(13);
    expect(e.effects[0]).toMatchObject({ activityTypesMatch: ["utility"], options: { transfer: false } });
  });

  it("ignores unrelated damage types when the resistance is to the triggering damage", () => {
    const e = build(
      GrantResistance,
      "Sheltering Shield",
      "When a test ward would take damage, it conjures a sphere of magical force. Creatures inside the sphere have resistance to the damage that triggered this reaction.",
    );
    expect(e.effects).toHaveLength(13);
  });

  it("does not offer damage the feature deals as a resistance option", () => {
    const e = build(
      GrantResistance,
      "Protective Bond",
      "Trigger: A creature within 60 feet takes damage. Response: The creature gains Resistance to the triggering damage, and the test doll takes 10 (3d6) Force damage.",
    );
    expect(e.effects).toHaveLength(13);
  });

  it("gives a grant its own activity when a later save only ends it", () => {
    const e = build(
      GrantResistance,
      "Kiss",
      "The test witch kisses a willing Humanoid. The target has immunity to cold damage, but it is charmed by the witch. If harmed, it can make a DC 16 Wisdom saving throw, ending the effect on itself on a success.",
    );
    expect(e.additionalActivities[0]?.init?.name).toBe("Grant Resistance");
    expect(e.effects[0]).toMatchObject({ activityTypesMatch: ["utility"], statuses: ["Charmed"] });
  });

  it("rides a save that gates the grant", () => {
    const e = build(GrantResistance, "Bind", "The target must succeed on a DC 13 Charisma saving throw or be bound. While bound, the creature has resistance to psychic damage.");
    expect(e.type).toBeNull();
    expect(e.additionalActivities).toEqual([]);
    expect(e.effects[0]).toMatchObject({ activityTypesMatch: ["save"] });
  });

  it("adds a grant utility beside a roll against other creatures", () => {
    const e = build(
      GrantResistance,
      "Alchemical Vapors",
      "Each other creature within 15 feet must make a DC 13 Constitution saving throw, taking 17 (5d6) poison damage on a failed save. Each ally within 15 feet has resistance to fire damage for 1 minute.",
    );
    expect(e.type).toBeNull();
    expect(e.additionalActivities[0].init).toEqual({ name: "Grant Resistance", id: "ddbGrantResist01", type: "utility" });
    expect(e.additionalActivities[0].overrides?.noeffect).toBe(false);
    expect(e.effects[0]).toMatchObject({ activityTypesMatch: ["utility"], options: { durationSeconds: 60 } });
  });
});

describe("generic monster form resistance", () => {
  it("reads every grant and condition immunity in a form trait", () => {
    const text = "The test ghost has resistance to acid and fire damage, it has immunity to the prone condition, and it has immunity to bludgeoning, piercing, and slashing damage from nonmagical attacks.";
    const grants = parseAllSelfResistances(text);
    expect(grants.map((grant) => grant.trait)).toEqual(["dr", "di"]);
    expect(grants[1].nonmagical).toBe(true);
    expect(parseConditionImmunities(text)).toEqual(["prone"]);
  });

  it("makes a Living Shadow style toggle named for the form", () => {
    const e = build(
      FormResistance,
      "Ghostly Body (Ghost Form Only)",
      "The test spider has resistance to acid, cold, fire, lightning, and thunder damage and to bludgeoning, piercing, and slashing damage from nonmagical attacks.",
    );
    expect(e.type).toBe("utility");
    expect(e.activity).toMatchObject({ name: "Enter Ghost Form", activationType: "special", targetSelf: true });
    const [effect] = e.effects;
    expect(effect).toMatchObject({ activityMatch: "Enter Ghost Form", options: { expiry: null, durationSeconds: null } });
    expect(effect.changes?.filter((c: IActiveEffectChangeData) => c.key === "system.traits.dr.value")).toHaveLength(8);
    expect(effect.changes).toContainEqual(expect.objectContaining({ key: "system.traits.dr.bypasses", value: "mgc" }));
  });

  it("names a state toggle from the While clause", () => {
    const e = build(FormResistance, "Shield", "While Bloodied, the test hunter has Resistance to Force damage.");
    expect(e.activity).toMatchObject({ name: "Apply Shield", activationCondition: "Apply while Bloodied. Remove the effect when that ends." });
  });
});

describe("shape-shift form resistance", () => {
  it("adds resistance only to the form whose passage grants it", () => {
    const e = makeEnricherData(ShapeShift, {
      name: "Shape-Shift",
      actions: null,
      ddbParser: {
        strippedHtml: "The test vampire shape-shifts into a Tiny bat (Speed 5 ft., Fly Speed 30 ft.) or a Medium cloud of mist (Speed 5 ft., Fly Speed 20 ft.), or it returns to its true form. While in bat form, it can't speak. While in mist form, it can't take any actions. It has Resistance to all damage, except the damage it takes from sunlight.",
        ddbMonster: { npc: { system: { attributes: { movement: { speeds: { walk: 30 } } } } } },
      },
    });
    e.document = { system: { activities: {} }, effects: [] };
    const effects = e.effects;
    const bat = effects.find((effect) => effect.name === "Bat Form");
    const mist = effects.find((effect) => effect.name === "Cloud of Mist Form");
    expect(bat?.changes?.some((c) => c.key === "system.traits.dr.value")).toBe(false);
    expect(mist?.changes?.filter((c) => c.key === "system.traits.dr.value")).toHaveLength(13);
  });
});
