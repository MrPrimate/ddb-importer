vi.mock("../../../src/config/_module", async () => {
  const dict = await vi.importActual<any>("../../../src/config/dictionary/dictionary");
  return { SETTINGS: { MODULE_ID: "ddb-importer" }, DICTIONARY: dict.default };
});
vi.mock("../../../src/effects/_module", () => ({}));
vi.mock("../../../src/effects/DDBEffectHelper", () => ({ default: {} }));

import DDBMonster from "../../../src/parser/DDBMonster";
import "../../../src/parser/monster/movement";
import { makeMockMonster } from "../../_fixtures/mockMonster";

describe("DDBMonster._generateMovement", () => {
  const generateMovement = DDBMonster.prototype._generateMovement;

  it("no movements: all speeds remain 0", () => {
    const mock = makeMockMonster({ source: { movements: [] } });
    generateMovement.call(mock);

    expect(mock.npc.system.attributes.movement.walk).toBe(0);
    expect(mock.npc.system.attributes.movement.fly).toBe(0);
    expect(mock.npc.system.attributes.movement.swim).toBe(0);
    expect(mock.npc.system.attributes.movement.units).toBe("ft");
  });

  // movementId 1 = Walk in CONFIG.DDB.movements
  it("walking speed 30ft", () => {
    const mock = makeMockMonster({
      source: { movements: [{ movementId: 1, speed: 30, notes: null }] },
    });
    generateMovement.call(mock);

    expect(mock.npc.system.attributes.movement.walk).toBe(30);
  });

  // Giant Wolf Spider: walk 40, climb 40
  it("Giant Wolf Spider: walk 40, climb 40", () => {
    const mock = makeMockMonster({
      source: {
        movements: [
          { movementId: 1, speed: 40, notes: null },
          { movementId: 3, speed: 40, notes: null }, // climb
        ],
      },
    });
    generateMovement.call(mock);

    expect(mock.npc.system.attributes.movement.walk).toBe(40);
    expect(mock.npc.system.attributes.movement.climb).toBe(40);
  });

  // Dragon with fly speed
  it("flying creature: walk 40, fly 80", () => {
    const mock = makeMockMonster({
      source: {
        movements: [
          { movementId: 1, speed: 40, notes: null },
          { movementId: 4, speed: 80, notes: null }, // fly
        ],
      },
    });
    generateMovement.call(mock);

    expect(mock.npc.system.attributes.movement.walk).toBe(40);
    expect(mock.npc.system.attributes.movement.fly).toBe(80);
  });

  it("hover flight sets hover flag", () => {
    const mock = makeMockMonster({
      source: {
        movements: [
          { movementId: 4, speed: 30, notes: "hover" },
        ],
      },
    });
    generateMovement.call(mock);

    expect(mock.npc.system.attributes.movement.fly).toBe(30);
    expect(mock.npc.system.attributes.movement.hover).toBe(true);
  });

  it("swimming speed", () => {
    const mock = makeMockMonster({
      source: {
        movements: [
          { movementId: 1, speed: 10, notes: null },
          { movementId: 5, speed: 40, notes: null }, // swim
        ],
      },
    });
    generateMovement.call(mock);

    expect(mock.npc.system.attributes.movement.walk).toBe(10);
    expect(mock.npc.system.attributes.movement.swim).toBe(40);
  });

  it("burrow speed", () => {
    const mock = makeMockMonster({
      source: {
        movements: [
          { movementId: 1, speed: 30, notes: null },
          { movementId: 2, speed: 15, notes: null }, // burrow
        ],
      },
    });
    generateMovement.call(mock);

    expect(mock.npc.system.attributes.movement.walk).toBe(30);
    expect(mock.npc.system.attributes.movement.burrow).toBe(15);
  });

  it("movement notes added to special array", () => {
    const mock = makeMockMonster({
      source: {
        movements: [
          { movementId: 4, speed: 60, notes: "hover" },
        ],
      },
    });
    generateMovement.call(mock);

    expect(mock.movement.special.length).toBeGreaterThan(0);
    expect(mock.movement.special[0]).toContain("hover");
  });

  it("stores movement data on this.movement", () => {
    const mock = makeMockMonster({
      source: { movements: [{ movementId: 1, speed: 30, notes: null }] },
    });
    generateMovement.call(mock);

    expect(mock.movement.movement).toBe(mock.npc.system.attributes.movement);
  });
});
