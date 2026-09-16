import ShapeShift from "../../../src/parser/enrichers/monster/Generic/ShapeShift";
import { makeEnricherData } from "../../_fixtures/ddb/factories";
import { installActivityConfigStubs } from "../../_fixtures/ddb/stubs";

beforeAll(() => installActivityConfigStubs());

function shapeShift(text: string): ShapeShift {
  const e = makeEnricherData(ShapeShift, {
    name: "Shape-Shift",
    actions: null,
    ddbParser: { strippedHtml: text, actionData: { damageParts: [] } },
  });
  e.document = { system: { activities: {} }, effects: [] };
  return e;
}

describe("monster Shape-Shift", () => {
  it("builds one speed-override effect per form listed with speeds", () => {
    const e = shapeShift("The quasit shape-shifts to resemble a bat (Speed 10 ft., Fly 40 ft.), a centipede (40 ft., Climb 40 ft.), or a toad (40 ft., Swim 40 ft.), or it returns to its true form.");
    expect(e.type).toBe("utility");
    expect(e.effects.map((f) => f.name)).toEqual(["Bat Form", "Centipede Form", "Toad Form"]);
    expect(e.effects[0].changes).toEqual([
      expect.objectContaining({ key: "system.attributes.movement.speeds.walk", value: "10" }),
      expect.objectContaining({ key: "system.attributes.movement.speeds.fly", value: "40" }),
    ]);
    expect(e.effects[1].changes?.map((c) => c.key)).toEqual([
      "system.attributes.movement.speeds.walk",
      "system.attributes.movement.speeds.climb",
    ]);
  });

  it("reads the vampire's 'Fly Speed' wording and sized forms", () => {
    const e = shapeShift("If the vampire isn’t in sunlight or running water, it shape-shifts into a Tiny bat (Speed 5 ft., Fly Speed 30 ft.) or a Medium cloud of mist (Speed 5 ft., Fly Speed 20 ft. ), or it returns to its vampire form.");
    expect(e.effects.map((f) => f.name)).toEqual(["Bat Form", "Cloud of Mist Form"]);
    expect(e.effects[1].changes?.map((c) => c.value)).toEqual(["5", "20"]);
  });

  it("keeps the utility and adds no effect for forms described only by size", () => {
    const e = shapeShift("The werebear shape-shifts into a Large bear-humanoid hybrid form or a Large bear, or it returns to its true humanoid form.");
    expect(e.type).toBe("utility");
    expect(e.effects).toEqual([]);
  });
});
