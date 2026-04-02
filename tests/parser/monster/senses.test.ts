vi.mock("../../../src/config/_module", async () => {
  const dict = await vi.importActual<any>("../../../src/config/dictionary/dictionary");
  return { SETTINGS: { MODULE_ID: "ddb-importer" }, DICTIONARY: dict.default };
});
vi.mock("../../../src/effects/_module", () => ({}));
vi.mock("../../../src/effects/DDBEffectHelper", () => ({ default: {} }));

import DDBMonster from "../../../src/parser/DDBMonster";
import "../../../src/parser/monster/senses";
import { makeMockMonster } from "../../_fixtures/mockMonster";

describe("DDBMonster._generateSenses", () => {
  const generateSenses = DDBMonster.prototype._generateSenses;

  it("no senses: all ranges 0", () => {
    const mock = makeMockMonster({ source: { senses: [] } });
    generateSenses.call(mock);

    expect(mock.npc.system.attributes.senses.ranges.darkvision).toBe(0);
    expect(mock.npc.system.attributes.senses.ranges.blindsight).toBe(0);
    expect(mock.npc.system.attributes.senses.ranges.tremorsense).toBe(0);
    expect(mock.npc.system.attributes.senses.ranges.truesight).toBe(0);
    expect(mock.npc.system.attributes.senses.units).toBe("ft");
  });

  it("darkvision 60 ft.", () => {
    const mock = makeMockMonster({
      source: { senses: [{ senseId: 2, notes: "60 ft." }] },
    });
    generateSenses.call(mock);

    expect(mock.npc.system.attributes.senses.ranges.darkvision).toBe(60);
  });

  it("darkvision 120 ft.", () => {
    const mock = makeMockMonster({
      source: { senses: [{ senseId: 2, notes: "120 ft." }] },
    });
    generateSenses.call(mock);

    expect(mock.npc.system.attributes.senses.ranges.darkvision).toBe(120);
  });

  // Giant Wolf Spider: blindsight 10, darkvision 60
  it("Giant Wolf Spider: blindsight 10, darkvision 60", () => {
    const mock = makeMockMonster({
      source: {
        senses: [
          { senseId: 1, notes: "10 ft." },
          { senseId: 2, notes: "60 ft." },
        ],
      },
    });
    generateSenses.call(mock);

    expect(mock.npc.system.attributes.senses.ranges.blindsight).toBe(10);
    expect(mock.npc.system.attributes.senses.ranges.darkvision).toBe(60);
  });

  it("tremorsense 60 ft.", () => {
    const mock = makeMockMonster({
      source: { senses: [{ senseId: 3, notes: "60 ft." }] },
    });
    generateSenses.call(mock);

    expect(mock.npc.system.attributes.senses.ranges.tremorsense).toBe(60);
  });

  it("truesight 120 ft.", () => {
    const mock = makeMockMonster({
      source: { senses: [{ senseId: 4, notes: "120 ft." }] },
    });
    generateSenses.call(mock);

    expect(mock.npc.system.attributes.senses.ranges.truesight).toBe(120);
  });

  it("blind beyond this radius added to special", () => {
    const mock = makeMockMonster({
      source: { senses: [{ senseId: 1, notes: "60 ft. (blind beyond this radius)" }] },
    });
    generateSenses.call(mock);

    expect(mock.npc.system.attributes.senses.ranges.blindsight).toBe(60);
    expect(mock.npc.system.attributes.senses.special).toContain("Blind beyond this radius");
  });

  it("multiple senses combined", () => {
    const mock = makeMockMonster({
      source: {
        senses: [
          { senseId: 1, notes: "30 ft." },
          { senseId: 2, notes: "60 ft." },
          { senseId: 4, notes: "120 ft." },
        ],
      },
    });
    generateSenses.call(mock);

    expect(mock.npc.system.attributes.senses.ranges.blindsight).toBe(30);
    expect(mock.npc.system.attributes.senses.ranges.darkvision).toBe(60);
    expect(mock.npc.system.attributes.senses.ranges.truesight).toBe(120);
  });
});
