import Maneuver from "../../../src/parser/enrichers/monster/Generic/Maneuver";
import DeflectMissile from "../../../src/parser/enrichers/monster/Generic/DeflectMissile";
import Counterattack from "../../../src/parser/enrichers/monster/Generic/Counterattack";
import WarCry from "../../../src/parser/enrichers/monster/Generic/WarCry";
import GrappleConditions from "../../../src/parser/enrichers/monster/Generic/GrappleConditions";
import ConsumeLife from "../../../src/parser/enrichers/monster/Generic/ConsumeLife";
import DamageAura from "../../../src/parser/enrichers/monster/Generic/DamageAura";
import ObserverCheck from "../../../src/parser/enrichers/monster/Generic/ObserverCheck";
import OngoingDamage from "../../../src/parser/enrichers/monster/Generic/OngoingDamage";
import StagedSave from "../../../src/parser/enrichers/monster/Generic/StagedSave";
import InfernalWound from "../../../src/parser/enrichers/monster/Generic/InfernalWound";
import FeyMelody from "../../../src/parser/enrichers/monster/Generic/FeyMelody";
import StatusRider from "../../../src/parser/enrichers/monster/Generic/StatusRider";
import { makeEnricherData } from "../../_fixtures/ddb/factories";
import { installActivityConfigStubs } from "../../_fixtures/ddb/stubs";
import type _MonsterFeatureSupport from "../../../src/parser/enrichers/monster/Generic/_MonsterFeatureSupport";

beforeAll(() => installActivityConfigStubs());

function feature<T extends _MonsterFeatureSupport>(
  Enricher: new (options: ConstructorParameters<typeof DamageAura>[0]) => T,
  name: string,
  text: string,
  parser: Record<string, unknown> = {},
): T {
  const e = makeEnricherData(Enricher, {
    name,
    actions: null,
    ddbParser: { strippedHtml: text, actionData: { damageParts: [] }, ...parser },
  });
  e.document = { system: { activities: {} }, effects: [] };
  return e;
}

describe("monster aura variants", () => {
  it.each([
    ["start", "turnStart", "5", 2],
    ["end", "turnEnd", "15", 4],
  ])("preserves %s timing, radius and dice", (edge, activation, radius, dice) => {
    const e = feature(
      DamageAura,
      "Fire Aura",
      `At the ${edge} of each of the test creature's turns, each creature in a ${radius}-foot Emanation takes 12 (${dice}d6) Fire damage.`,
    );
    expect(e.activity).toMatchObject({
      activationType: activation,
      noConsumeTargets: true,
      damageParts: [{ number: dice, denomination: 6, types: ["fire"] }],
      data: { target: { template: { size: radius } } },
    });
    expect(e.activity?.data?.behaviors).toBeUndefined();
    expect(e.effects).toEqual([]);
  });
  it("does not apply owner-turn behavior to a target-turn variant", () => {
    const e = feature(DamageAura, "Fire Aura", "A creature starting its turn nearby takes 7 (2d6) Fire damage.");
    expect(e.type).toBeNull();
    expect(e.activity).toBeNull();
  });
  it("separates legacy aura damage from contact damage and its smaller reach", () => {
    const e = feature(
      DamageAura,
      "Fire Aura",
      "At the start of each of the ember's turns, each creature within 20 feet of it takes 9 (2d8) fire damage. A creature touching it within 5 feet of it takes 4 (1d8) fire damage.",
    );
    expect(e.activity).toMatchObject({
      activationType: "turnStart",
      damageParts: [{ number: 2, denomination: 8 }],
      data: { target: { template: { size: "20" } } },
    });
    expect(e.activity?.damageParts).toHaveLength(1);
    expect(e.additionalActivities[0]).toMatchObject({
      init: { id: "ddbAuraContact01", type: "damage" },
      build: {
        damageParts: [{ number: 1, denomination: 8 }],
        rangeOverride: { units: "ft", value: "5" },
        activationOverride: { type: "special" },
        targetOverride: { template: { type: "" } },
      },
      overrides: { noConsumeTargets: true, noeffect: true },
    });
    expect(e.effects).toEqual([]);
  });
  it("adds Burning only when the source explicitly ignites targets", () => {
    const e = feature(
      DamageAura,
      "Fire Aura",
      "At the end of each of the ember's turns, each creature in a 5-foot Emanation takes 3 (1d6) Fire damage. Creatures start burning.",
    );
    expect(e.effects[0]).toMatchObject({ statuses: ["Burning"], activityMatch: "Aura Damage" });
  });
});

describe("observer checks", () => {
  it.each([
    ["Mimicry", "Insight", "ins", 11],
    ["Transparent", "Perception", "prc", 17],
    ["Mimicry", "Survival", "sur", 15],
    ["Mimicry", "Animal Handling", "ani", 12],
  ])("uses the observer's %s check and source DC", (name, skill, associated, dc) => {
    const e = feature(ObserverCheck, name, `An observer makes a DC ${dc} Wisdom (${skill}) check.`);
    expect(e.activity?.data).toMatchObject({
      check: { ability: "wis", associated: [associated], dc: { formula: String(dc) } },
    });
  });
  it("leaves DC-less variants unchanged", () => {
    expect(feature(ObserverCheck, "Mimicry", "It repeats noises.").type).toBeNull();
  });
});

describe("ongoing damage separation", () => {
  const text =
    "Hit: 8 (2d6 + 1) Bludgeoning damage. Until the grapple ends, the target takes 8 (2d6 + 1) Bludgeoning damage at the start of each of its turns.";
  it("does not infer a regurgitation save when its clause is absent", () => {
    const e = feature(
      OngoingDamage,
      "Swallow",
      `DC 12 Constitution saving throw. ${text} The monster can regurgitate the target.`,
    );
    expect(e.additionalActivities.map((a) => a.init?.name)).toEqual(["Ongoing Damage"]);
  });
  it("keeps identical initial and tick formulas as separate occurrences", async () => {
    const e = feature(OngoingDamage, "Constricting Vine", text);
    e.document.system.activities = {
      attack: { _id: "attack", type: "attack", damage: { includeBase: true, parts: [{ number: 9 }] } },
    };
    e.document.effects = [{ _id: "held", name: "Held Conditions" }];
    await e.cleanup();
    expect(e.activities[0].damage).toMatchObject({ includeBase: false, parts: [{ number: 2, bonus: "1" }] });
    expect(e.activities[0].damage?.parts).toHaveLength(1);
    expect(e.additionalActivities[0].build?.damageParts).toHaveLength(1);
    expect(e.additionalActivities[0].build?.activationOverride?.condition).toContain("its turns");
    expect(e.additionalActivities[0].overrides).toMatchObject({ noConsumeTargets: true, noeffect: true });
    const held = e.effects[0];
    expect(held).toMatchObject({ name: "Held Conditions", activityTypesMatch: ["attack", "save", "utility"] });
    expect(held.activityMatch).toBeUndefined();
  });
  it("preserves an existing @mod part when it matches the source ability", () => {
    const e = feature(OngoingDamage, "Smother", text, {
      actionData: {
        baseAbility: "str",
        damageParts: [
          {
            damageString: "2d6 + @mod",
            damageTypes: ["bludgeoning"],
            damageHasMod: true,
            part: { number: 2, denomination: 6, bonus: "@mod", types: ["bludgeoning"] },
          },
        ],
      },
      ddbMonster: { npc: { system: { abilities: { str: { value: 12 } } } } },
    });
    expect(e.split?.initial[0].bonus).toBe("@mod");
  });
  it("retains the source monster's regurgitation save without spending another use", () => {
    const e = feature(
      OngoingDamage,
      "Swallow",
      "Dexterity Saving Throw: DC 15. While swallowed, it takes 7 (2d6) Acid damage at the start of each of the test monster's turns. If the monster takes 20 damage, it makes a DC 12 Constitution saving throw at the end of that turn or regurgitates the target.",
    );
    const save = e.additionalActivities.find((a) => a.init?.name === "Regurgitate Save");
    expect(save?.build).toMatchObject({
      saveOverride: { ability: ["con"], dc: { formula: "12" } },
      targetOverride: { affects: { type: "self" } },
      generateConsumption: false,
    });
    expect(e.split?.initial).toEqual([]);
  });
  it("does not split an unrelated Vortex variant", () => {
    const e = feature(
      OngoingDamage,
      "Vortex",
      "Failure: 7 (2d6) Thunder damage. This vortex ends at the start of the monster's next turn.",
    );
    expect(e.split).toBeNull();
    expect(e.clearAutoEffects).toBe(false);
  });
  it("makes the optional grapple a separate non-damaging choice", () => {
    const e = feature(OngoingDamage, "Smother", text + " It can grapple instead of dealing damage.");
    const grapple = e.additionalActivities.find((a) => a.init?.id === "ddbGrappleAlt001");
    expect(grapple?.init?.name).toBe("Grapple Instead");
    // the held conditions link to the grapple alternative, never the damaging attack
    expect(e.effects[0].activityMatch).toBe("Grapple Instead");
    expect(e.effects[0].activityTypesMatch).toBeUndefined();
  });
});

describe("staged saves", () => {
  it.each([
    ["Sleep Breath", "Incapacitated", "Unconscious", 120],
    ["Petrifying Bite", "Restrained", "Petrified", 86400],
  ])("links %s stages independently", async (name, first, second, seconds) => {
    const duration = seconds === 120 ? "2 minutes" : "24 hours";
    const e = feature(
      StagedSave,
      name,
      `Constitution Saving Throw: DC 13. First Failure: ${first}. Second Failure: ${second} for ${duration}.`,
    );
    e.document.system.activities = {
      attack: { type: "attack" },
      first: { type: "save", consumption: { targets: [{ type: "itemUses", value: "1" }] } },
      second: { type: "save", _id: "ddbSecondSave001" },
    };
    await e.cleanup();
    expect(e.activities.map((a) => a.name)).toEqual([undefined, "First Save", undefined]);
    expect(e.effects[0]).toMatchObject({ activityTypesMatch: ["save"], activityIdsExclude: ["ddbSecondSave001"] });
    expect(e.effects[1].activityMatch).toBe(e.additionalActivities[0].init?.name);
    expect(e.effects[1].options?.durationSeconds).toBe(seconds);
    expect(e.additionalActivities[0].build?.generateConsumption).toBe(false);
    expect(e.activities[1].consumption?.targets).toHaveLength(1);
  });
  it("does not rewrite a single-stage legacy sleep", () => {
    const e = feature(
      StagedSave,
      "Sleep Breath",
      "DC 13 Constitution saving throw. On failure, fall Unconscious for 1 minute.",
    );
    expect(e.effects).toEqual([]);
    expect(e.additionalActivities).toEqual([]);
  });
});

describe("wounds, healing and shared-name buffs", () => {
  it("models infernal HP loss as untyped damage on the target's turn", () => {
    const e = feature(
      InfernalWound,
      "Infernal Tail",
      "An infernal wound loses 9 (2d8) Hit Points at the start of each of its turns. The wound closes after 1 minute. Stanch it with a DC 16 Wisdom (Medicine) check.",
    );
    const [loss, stanch] = e.additionalActivities;
    expect(loss.init?.type).toBe("damage");
    expect(loss.build?.damageParts?.[0]).toMatchObject({ number: 2, denomination: 8, types: [] });
    expect(loss.build?.activationOverride?.type).toBe("special");
    expect(loss.build?.activationOverride?.condition).not.toMatch(/further hit/);
    expect(stanch.build?.checkOverride?.dc?.formula).toBe("16");
    const [tracker] = e.effects;
    expect(tracker.name).toBe("Infernal Wound");
    expect(tracker.activityTypesMatch).toEqual(["save", "attack"]);
    expect(tracker.activityMatch).toBeUndefined();
    expect(tracker.options?.durationSeconds).toBe(60);
  });
  it("reads the legacy infernal wound wording without a timer", () => {
    const e = feature(
      InfernalWound,
      "Glaive",
      "Hit: 8 (1d10 + 3) slashing damage. If the target is a creature other than an undead or a construct, it must succeed on a DC 12 Constitution saving throw or lose 5 (1d10) hit points at the start of each of its turns due to an infernal wound. Each time the devil hits the wounded target with this attack, the damage dealt by the wound increases by 5 (1d10). Any creature can take an action to stanch the wound with a successful DC 12 Wisdom (Medicine) check.",
    );
    const [loss, stanch] = e.additionalActivities;
    expect(loss.init?.type).toBe("damage");
    expect(loss.build?.damageParts?.[0]).toMatchObject({ number: 1, denomination: 10, types: [] });
    expect(loss.build?.activationOverride?.condition).toMatch(/adds another 1d10/);
    expect(stanch.build?.checkOverride?.associated).toEqual(["med"]);
    expect(e.effects[0].options?.durationSeconds).toBeNull();
  });
  it("leaves an ordinary glaive alone", () => {
    const e = feature(InfernalWound, "Glaive", "Hit: 8 (1d10 + 3) slashing damage.");
    expect(e.additionalActivities).toEqual([]);
    expect(e.effects).toEqual([]);
  });
  it("keeps War Cry's temporary HP and source-turn advantage distinct", () => {
    const e = feature(
      WarCry,
      "War Cry",
      "One creature gains 9 (2d6 + 2) Temporary Hit Points and has Advantage on attack rolls until the start of the caller's next turn.",
    );
    expect(e.type).toBe("heal");
    expect(e.healing).toMatchObject({ number: 2, denomination: 6, bonus: "2", types: ["temphp"] });
    expect(e.effects[0].options?.expiry).toBe("sourceStart");
  });
  it("does not give AC to a Counterattack variant that only attacks", () => {
    const e = feature(Counterattack, "Counterattack", "Response: The captain makes a weapon attack.");
    expect(e.type).toBeNull();
    expect(e.effects).toEqual([]);
  });
  it("declines a melee-only AC bonus rather than raising AC against every attack", () => {
    const e = feature(
      Counterattack,
      "Counterattack",
      "It adds 4 to its AC against melee attack rolls until the start of its next turn.",
    );
    expect(e.effects).toEqual([]);
  });
  it("uses a utility roll for damage reduction", () => {
    const e = feature(
      DeflectMissile,
      "Deflect Missile",
      "It reduces the damage it takes from the attack by 8 (1d10 + 3).",
    );
    expect(e.additionalActivities[0]).toMatchObject({
      init: { type: "utility" },
      build: { rollOverride: { formula: "1d10 + 3" } },
    });
  });
  it("keeps charming melody free of damage", () => {
    const e = feature(
      FeyMelody,
      "Fey Melody",
      "Wisdom Saving Throw: DC 14. Charming. Charmed for 1 minute. Frightening. 9 (2d6 + 2) Psychic damage and Frightened for 1 minute.",
    );
    expect(e.activity?.removeDamageParts).toBe(true);
    expect(e.additionalActivities[0].overrides?.damageParts).toMatchObject([{ number: 2, types: ["psychic"] }]);
  });
});

describe("shared grapple name guards", () => {
  it("adds both conditions for a simple restraining hit", () => {
    const e = feature(
      GrappleConditions,
      "Claws",
      "If the target is a Large or smaller creature, it has the Grappled condition, and it has the Restrained condition until the grapple ends.",
    );
    expect(e.effects[0].statuses).toEqual(["Grappled", "Restrained"]);
    expect(e.effects[0].activityTypesMatch).toEqual(["attack"]);
  });
  it("does not attach a grapple to an unrelated claw rider", () => {
    const e = feature(
      GrappleConditions,
      "Claws",
      "If the target is a Large or smaller creature, it has the Prone condition.",
    );
    expect(e.clearAutoEffects).toBe(false);
    expect(e.effects).toEqual([]);
  });
});

it("keeps a lowercase daily limit on the maneuver utility", async () => {
  const e = feature(Maneuver, "Maneuver", "An ally may use a reaction to move without provoking an attack.", {
    fullName: "Maneuver (2/day)",
  });
  e.document.system.activities = { maneuver: { name: "Maneuver", type: "utility" } };
  await e.cleanup();
  expect(e.document.system.uses).toMatchObject({ max: "2", recovery: [{ period: "day" }] });
  expect(e.activities[0].consumption?.targets).toEqual([{ type: "itemUses", target: "", value: "1" }]);
  expect(e.activity?.noTemplate).toBe(true);
});

describe("Consume Life effect links", () => {
  it("links the death rider to the save by type, never the healing roll", () => {
    const e = feature(ConsumeLife, "Consume Life", "DC 12 Constitution saving throw. On a failure, the target dies.");
    expect(e.effects[0]).toMatchObject({ name: "Consumed Life", activityTypesMatch: ["save"] });
    expect(e.effects[0].activityMatch).toBeUndefined();
  });
});

describe("monster StatusRider", () => {
  it("applies a shared-name rider only when the feature carries its wording", () => {
    const gasSpore = feature(StatusRider, "Tendril", "Melee Attack Roll: +0, reach 5 ft. Hit: 3 (1d6) Poison damage, and the target has the Poisoned condition until the end of its next turn.");
    expect(gasSpore.effects).toHaveLength(1);
    expect(gasSpore.effects[0].statuses).toEqual(["Poisoned"]);
    expect(gasSpore.clearAutoEffects).toBe(true);

    // a Roper's Tendril grapples; it keeps whatever the parser built
    const roper = feature(StatusRider, "Tendril", "Melee Weapon Attack: +7 to hit, reach 50 ft., one creature. Hit: The target is grappled (escape DC 15).");
    expect(roper.effects).toEqual([]);
    expect(roper.clearAutoEffects).toBe(false);
  });

  it("matches Charming's charm and incapacitation across sentences, and not an unrelated Charming", () => {
    const satyr = feature(StatusRider, "Charming", "The target has the Charmed condition for 1 minute. While Charmed, the target has the Incapacitated condition.");
    expect(satyr.effects[0].statuses).toEqual(["Charmed", "Incapacitated"]);
    const redirect = feature(StatusRider, "Charming (3/Day)", "When a creature makes an attack against the wizard, the creature must succeed on a DC 14 Wisdom saving throw or target the next closest creature.");
    expect(redirect.effects).toEqual([]);
  });

  it("keeps the 2024 speed penalties off the 2014 stat blocks of the same name", () => {
    const text = "Hit: 14 (2d8 + 5) Piercing damage plus 10 (3d6) Cold damage. Until the end of the devil's next turn, the target can't take Reactions and its Speed decreases by 10 feet.";
    expect(feature(StatusRider, "Ice Spear", text).effects).toHaveLength(1);
    const legacy = makeEnricherData(StatusRider, { name: "Ice Spear", actions: null, is2014: true, ddbParser: { strippedHtml: text } });
    expect(legacy.effects).toEqual([]);
    expect(legacy.clearAutoEffects).toBe(false);
  });

  it("applies a distinctive name's rider with no wording check", () => {
    expect(feature(StatusRider, "Brutal Gore", "Hit: damage.").effects[0].statuses).toEqual(["Prone"]);
  });
});
