// The feature factory initializes the real activity/enricher dependency chain first.
import "../../../src/parser/features/CharacterFeatureFactory";
import DDBSpellActivity from "../../../src/parser/activities/DDBSpellActivity";
import DDBSpellEnricher from "../../../src/parser/enrichers/DDBSpellEnricher";
import type DDBSpell from "../../../src/parser/spells/DDBSpell";
import { ongoingAttack, ongoingClone, ongoingTrigger, movementDamage } from "../../../src/parser/enrichers/spell/_SpellRegions";
import { installActivityConfigStubs } from "../../_fixtures/ddb/stubs";

beforeAll(() => {
  installActivityConfigStubs();
});

/** Synthetic spell host; activities go through the real builders, duplication and overrides. */
async function generate(name: string, is2014 = false, additionalActivities?: IDDBAdditionalActivity[]) {
  const definition = {
    name,
    level: 6,
    description: "",
    modifiers: [],
    range: { rangeValue: 60 },
    requiresSavingThrow: true,
    saveDcAbilityId: 2,
  };
  const parent = {
    name,
    originalName: name,
    is2014,
    forceDefaultActionBuild: true,
    ddbDefinition: definition,
    spellData: { definition },
    data: {
      name,
      type: "spell",
      effects: [],
      flags: {},
      system: {
        description: { value: "" },
        duration: { value: "10", units: "minute", concentration: true },
        activities: {},
      },
    },
  } as unknown as DDBSpell;
  const enricher = new DDBSpellEnricher({ activityGenerator: DDBSpellActivity });
  parent.enricher = enricher;
  await enricher.load({ ddbParser: parent, is2014 });
  if (additionalActivities) Object.defineProperty(enricher, "additionalActivities", { value: additionalActivities });

  const cast = new DDBSpellActivity({ type: "save", name: "Cast", ddbParent: parent });
  cast.build({ generateSave: true, generateDamage: true });
  const primary = await enricher.applyActivityOverride(cast.data);
  parent.data.system.activities[primary._id] = primary;
  await enricher._addActivityHintAdditionalActivities(parent);
  return Object.values(parent.data.system.activities);
}

function expectFollowUp(activity: I5eActivity) {
  expect(activity.duration).toMatchObject({ override: true, units: "inst", concentration: false });
  expect(activity.consumption).toMatchObject({ spellSlot: false, targets: [] });
  expect(activity.target?.template?.type ?? "").toBe("");
  expect(activity.behaviors ?? []).toEqual([]);
}

describe.each([false, true])("ongoing spell durations (2014: %s)", (is2014) => {
  it("keeps Blade Barrier's two concentrating cast shapes and a free instantaneous save", async () => {
    const [wall, ring, ongoing] = await generate("Blade Barrier", is2014);
    expect([wall.name, ring.name, ongoing.name]).toEqual(["Place Wall", "Place Ring", "Ongoing Save"]);
    for (const cast of [wall, ring]) {
      expect(cast.duration?.override).not.toBe(true);
      expect(cast.consumption?.spellSlot).toBe(true);
    }
    expect(ring.target?.template).toMatchObject({ type: "ring", size: "30" });
    expect(ongoing._id).toBe("ddbBlaBarZoneSa1");
    expectFollowUp(ongoing);
    assert("save" in ongoing && "save" in wall && "damage" in ongoing && "damage" in wall);
    expect(ongoing.save).toEqual(wall.save);
    expect(ongoing.damage).toEqual(wall.damage);
  });

  it("keeps Weird's cast duration and edition-specific repeat damage", async () => {
    const [cast, ongoing] = await generate("Weird", is2014);
    expect(cast.duration?.override).not.toBe(true);
    expect(cast.consumption?.spellSlot).toBe(true);
    expect(ongoing.name).toBe("End of Turn Save");
    expectFollowUp(ongoing);
    assert("save" in ongoing && "damage" in ongoing);
    expect(ongoing.save).toMatchObject({ ability: ["wis"], dc: { calculation: "spellcasting" } });
    expect(ongoing.damage).toMatchObject({
      onSave: "none",
      parts: [expect.objectContaining({ number: is2014 ? 4 : 5, denomination: 10, types: ["psychic"] })],
    });
  });
});

it("gives Wall of Death two casting shapes and instantaneous Wall Damage", async () => {
  const [wall, ring, ongoing] = await generate("Wall of Death");
  expect([wall.name, ring.name, ongoing.name]).toEqual(["Place Wall", "Place Ring", "Wall Damage"]);
  for (const cast of [wall, ring]) {
    expect(cast.duration?.override).not.toBe(true);
    expect(cast.consumption?.spellSlot).toBe(true);
  }
  expect(ongoing.type).toBe("damage");
  expectFollowUp(ongoing);
});

it.each([
  ["save", ongoingTrigger({ condition: "Enters the area" })],
  ["clone", ongoingClone("ddbTestOngoing01", "Enters the area")],
  ["attack", ongoingAttack({ name: "Follow-up Attack", condition: "Enters the area" })],
  ["movement", movementDamage("2d6")],
] as const)("overrides concentration through the shared %s builder", async (_name, hint) => {
  const [cast, ongoing] = await generate("Synthetic Area Spell", false, [hint]);
  expect(cast.duration?.override).not.toBe(true);
  expectFollowUp(ongoing);
});
