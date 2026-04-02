vi.mock("../../../src/config/_module", async () => {
  const dict = await vi.importActual<any>("../../../src/config/dictionary/dictionary");
  return { SETTINGS: { MODULE_ID: "ddb-importer" }, DICTIONARY: dict.default };
});
vi.mock("../../../src/effects/_module", () => ({}));
vi.mock("../../../src/effects/DDBEffectHelper", () => ({ default: {} }));

import DDBMonster from "../../../src/parser/DDBMonster";
import "../../../src/parser/monster/hp";
import { makeMockMonster } from "../../_fixtures/mockMonster";

describe("DDBMonster._generateHitPoints", () => {
  const generateHP = DDBMonster.prototype._generateHitPoints;

  it("sets average hit points as value and max", () => {
    const mock = makeMockMonster({ source: { averageHitPoints: 52 } });
    generateHP.call(mock);

    expect(mock.npc.system.attributes.hp.value).toBe(52);
    expect(mock.npc.system.attributes.hp.max).toBe(52);
  });

  it("sets formula from hitPointDice.diceString", () => {
    const mock = makeMockMonster({
      source: {
        averageHitPoints: 52,
        hitPointDice: { diceCount: 8, diceValue: 8, diceMultiplier: 0, fixedValue: 16, diceString: "8d8 + 16" },
      },
    });
    generateHP.call(mock);

    expect(mock.npc.system.attributes.hp.formula).toBe("8d8 + 16");
  });

  it("subtracts removed hit points from value", () => {
    const mock = makeMockMonster({ source: { averageHitPoints: 50 } });
    mock.removedHitPoints = 10;
    generateHP.call(mock);

    expect(mock.npc.system.attributes.hp.value).toBe(40);
    expect(mock.npc.system.attributes.hp.max).toBe(50);
  });

  it("stores temporary hit points", () => {
    const mock = makeMockMonster({ source: { averageHitPoints: 30 } });
    mock.temporaryHitPoints = 15;
    generateHP.call(mock);

    expect(mock.npc.system.attributes.hp.temp).toBe(15);
  });

  it("min is always 0", () => {
    const mock = makeMockMonster();
    generateHP.call(mock);

    expect(mock.npc.system.attributes.hp.min).toBe(0);
  });

  it("tempmax is always 0", () => {
    const mock = makeMockMonster();
    generateHP.call(mock);

    expect(mock.npc.system.attributes.hp.tempmax).toBe(0);
  });

  // Real monster: Tarrasque (averageHitPoints: 676, hitPointDice: "33d20 + 330")
  it("handles large HP values (Tarrasque)", () => {
    const mock = makeMockMonster({
      source: {
        averageHitPoints: 676,
        hitPointDice: { diceCount: 33, diceValue: 20, diceMultiplier: 0, fixedValue: 330, diceString: "33d20 + 330" },
      },
    });
    generateHP.call(mock);

    expect(mock.npc.system.attributes.hp.value).toBe(676);
    expect(mock.npc.system.attributes.hp.formula).toBe("33d20 + 330");
  });

  // Real monster: Giant Wolf Spider (averageHitPoints: 11, hitPointDice: "2d8 + 2")
  it("Giant Wolf Spider HP", () => {
    const mock = makeMockMonster({
      source: {
        averageHitPoints: 11,
        hitPointDice: { diceCount: 2, diceValue: 8, diceMultiplier: 0, fixedValue: 2, diceString: "2d8 + 2" },
      },
    });
    generateHP.call(mock);

    expect(mock.npc.system.attributes.hp.value).toBe(11);
    expect(mock.npc.system.attributes.hp.max).toBe(11);
    expect(mock.npc.system.attributes.hp.formula).toBe("2d8 + 2");
  });

  it("handles null removedHitPoints and temporaryHitPoints", () => {
    const mock = makeMockMonster({ source: { averageHitPoints: 20 } });
    mock.removedHitPoints = null;
    mock.temporaryHitPoints = null;
    generateHP.call(mock);

    expect(mock.npc.system.attributes.hp.value).toBe(20);
    expect(mock.npc.system.attributes.hp.temp).toBe(0);
  });
});
