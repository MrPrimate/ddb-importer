// The enricher barrel loads first: importing DDBMonsterFeatureEnricher directly re-enters the
// enricher tree mid-evaluation and DDBGenericEnricher extends an undefined mixin.
import { DDBMonsterFeatureEnricher, MonsterEnrichers } from "../../../src/parser/enrichers/_module";
import { makeEnricherData } from "../../_fixtures/ddb/factories";
import { installActivityConfigStubs } from "../../_fixtures/ddb/stubs";

const Teleport = MonsterEnrichers.Generic.Teleport;

beforeAll(() => installActivityConfigStubs());

function feature(name: string, text: string): InstanceType<typeof Teleport> {
  const e = makeEnricherData(Teleport, {
    name,
    actions: null,
    ddbParser: { strippedHtml: text, actionData: { damageParts: [] } },
  });
  e.document = { system: { activities: {} }, effects: [] };
  return e;
}

describe("generic monster teleport", () => {
  it("converts a legacy self-teleport and leaves activation to the parser", () => {
    const e = feature(
      "Teleport",
      "The test fiend magically teleports, along with any equipment it is wearing or carrying, up to 120 feet to an unoccupied space it can see.",
    );
    expect(e.type).toBe("teleport");
    expect(e.activity).toEqual({
      data: {
        range: { override: true, value: "120", units: "ft", special: "" },
        target: { override: true, prompt: false, affects: { count: "1", type: "self" }, template: {} },
      },
    });
    expect(e.activity).not.toHaveProperty("activationType");
    expect(e.activity).not.toHaveProperty("overrideActivation");
    expect(e.additionalActivities).toEqual([]);
  });

  it("reads the within form", () => {
    const e = feature("Psychic Step", "The test wyrm teleports to an unoccupied space it can see within 60 feet of it.");
    expect(e.activity?.data?.range).toMatchObject({ value: "60" });
  });

  it("prefers the travel distance over a nearby willing creature", () => {
    const e = feature(
      "Teleport",
      "The test fiend teleports itself or a willing ally within 10 feet of itself up to 60 feet to an unoccupied space it can see.",
    );
    expect(e.activity?.data?.range).toMatchObject({ value: "60" });
  });

  it("reads a bare distance", () => {
    const e = feature("Jaunt", "The test psion teleports 30 feet to an unoccupied space they can see.");
    expect(e.activity?.data?.range).toMatchObject({ value: "30" });
  });

  it("appends a costless teleport when the source rolls damage", () => {
    const e = feature(
      "Deathly Teleport",
      "The test lich teleports up to 60 feet to an unoccupied space it can see, and each creature within 10 feet of the space it left takes 11 (2d10) Necrotic damage.",
    );
    expect(e.type).toBeNull();
    expect(e.activity).toBeNull();
    expect(e.additionalActivities).toHaveLength(1);
    expect(e.additionalActivities[0]).toMatchObject({
      init: { name: "Teleport", id: "ddbTeleport00001", type: "teleport" },
      build: {
        generateConsumption: false,
        rangeOverride: { override: true, value: "60", units: "ft", special: "" },
        targetOverride: { affects: { type: "self" } },
        activationOverride: { type: "special" },
      },
    });
  });

  it("treats a save as a rider", () => {
    const e = feature(
      "Frightening Teleport",
      "The test giant teleports up to 40 feet to an unoccupied space it can see. Each creature within 10 feet of the location it left must succeed on a DC 16 Wisdom saving throw or have the frightened condition.",
    );
    expect(e.type).toBeNull();
    expect(e.additionalActivities[0]?.build?.rangeOverride).toMatchObject({ override: true, value: "40" });
  });

  it("keeps healing on the parser's additional heal and makes the teleport primary", () => {
    const e = feature(
      "Recuperative Teleport",
      "The test spirit teleports up to 60 feet to an unoccupied space it can see and regains 11 (2d10) Hit Points.",
    );
    expect(e.type).toBe("teleport");
    expect(e.activity?.data?.range).toMatchObject({ value: "60" });
    expect(e.additionalActivities).toEqual([]);
  });

  it("keeps a named follow-up attack as a plain teleport", () => {
    const e = feature(
      "Teleporting Lash",
      "The test emissary teleports up to 30 feet to an unoccupied space it can see and makes one Lash attack.",
    );
    expect(e.type).toBe("teleport");
  });

  it.each([
    ["passive target", "Hit: the target must succeed on a DC 14 Charisma saving throw or be teleported up to 15 feet."],
    ["planar travel", "The test spider teleports from the Material Plane to the Ethereal Plane or vice versa."],
    ["long range", "The test steed teleports itself to a location it is familiar with, up to 1 mile away."],
    ["reference only", "The test fiend uses its Teleport action."],
    ["no teleport", "The test creature turns invisible until the start of its next turn."],
  ])("keeps the parser default for %s", (_label, text) => {
    const e = feature("Teleport", text);
    expect(e.type).toBeNull();
    expect(e.activity).toBeNull();
    expect(e.additionalActivities).toEqual([]);
  });
});

describe("generic monster teleport resolution", () => {
  const enricher = new DDBMonsterFeatureEnricher({
    activityGenerator: null as unknown as TActivityGenerator,
  });

  it.each(["Teleport (Recharge 4–6)", "Teleport (Costs 2 Actions)", "Deathly Teleport", "Fey Step (Recharge 4–6)"])(
    "routes %s to the Teleport enricher",
    (name) => {
      expect(enricher._genericFeatureHint(name)).toBe("Teleport");
      expect(enricher.GENERIC_ENRICHERS.Teleport).toBe(Teleport);
    },
  );

  it("leaves Status Rider escapes alone", () => {
    expect(enricher._genericFeatureHint("Misty Escape")).toBe("Status Rider");
    expect(enricher._genericFeatureHint("Shadowy Teleport")).toBe("Status Rider");
  });
});
