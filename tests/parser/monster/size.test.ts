vi.mock("../../../src/config/_module", async () => {
  const dict = await vi.importActual<any>("../../../src/config/dictionary/dictionary");
  return { SETTINGS: { MODULE_ID: "ddb-importer" }, DICTIONARY: dict.default };
});
vi.mock("../../../src/effects/_module", () => ({}));
vi.mock("../../../src/effects/DDBEffectHelper", () => ({ default: {} }));

import DDBMonster from "../../../src/parser/DDBMonster";
import "../../../src/parser/monster/size";
import { makeMockMonster } from "../../_fixtures/mockMonster";

describe("DDBMonster.getSizeFromId", () => {
  const getSizeFromId = DDBMonster.prototype.getSizeFromId;

  it("returns Tiny for sizeId 2", () => {
    const mock = makeMockMonster();
    const result = getSizeFromId.call(mock, 2);
    expect(result.name).toBe("Tiny");
    expect(result.value).toBe("tiny");
    expect(result.size).toBe(0.5);
  });

  it("returns Small for sizeId 3", () => {
    const mock = makeMockMonster();
    const result = getSizeFromId.call(mock, 3);
    expect(result.name).toBe("Small");
    expect(result.value).toBe("sm");
  });

  it("returns Medium for sizeId 4", () => {
    const mock = makeMockMonster();
    const result = getSizeFromId.call(mock, 4);
    expect(result.name).toBe("Medium");
    expect(result.value).toBe("med");
    expect(result.size).toBe(1);
  });

  it("returns Large for sizeId 5", () => {
    const mock = makeMockMonster();
    const result = getSizeFromId.call(mock, 5);
    expect(result.name).toBe("Large");
    expect(result.value).toBe("lg");
    expect(result.size).toBe(2);
  });

  it("returns Huge for sizeId 6", () => {
    const mock = makeMockMonster();
    const result = getSizeFromId.call(mock, 6);
    expect(result.name).toBe("Huge");
    expect(result.value).toBe("huge");
    expect(result.size).toBe(3);
  });

  it("returns Gargantuan for sizeId 7", () => {
    const mock = makeMockMonster();
    const result = getSizeFromId.call(mock, 7);
    expect(result.name).toBe("Gargantuan");
    expect(result.value).toBe("grg");
    expect(result.size).toBe(4);
  });
});

describe("DDBMonster._generateSize", () => {
  const generateSize = DDBMonster.prototype._generateSize;

  it("sets Medium size data", () => {
    const mock = makeMockMonster({ source: { sizeId: 4 } });
    mock.getSizeFromId = DDBMonster.prototype.getSizeFromId;
    generateSize.call(mock);

    expect(mock.npc.system.traits.size).toBe("med");
    expect(mock.npc.prototypeToken.width).toBe(1);
    expect(mock.npc.prototypeToken.height).toBe(1);
  });

  it("sets Large size data with 2x2 token", () => {
    const mock = makeMockMonster({ source: { sizeId: 5 } });
    mock.getSizeFromId = DDBMonster.prototype.getSizeFromId;
    generateSize.call(mock);

    expect(mock.npc.system.traits.size).toBe("lg");
    expect(mock.npc.prototypeToken.width).toBe(2);
    expect(mock.npc.prototypeToken.height).toBe(2);
  });

  it("sets Gargantuan size data with 4x4 token", () => {
    const mock = makeMockMonster({ source: { sizeId: 7 } });
    mock.getSizeFromId = DDBMonster.prototype.getSizeFromId;
    generateSize.call(mock);

    expect(mock.npc.system.traits.size).toBe("grg");
    expect(mock.npc.prototypeToken.width).toBe(4);
    expect(mock.npc.prototypeToken.height).toBe(4);
  });

  it("sets Tiny size with 0.5x0.5 token", () => {
    const mock = makeMockMonster({ source: { sizeId: 2 } });
    mock.getSizeFromId = DDBMonster.prototype.getSizeFromId;
    generateSize.call(mock);

    expect(mock.npc.system.traits.size).toBe("tiny");
    expect(mock.npc.prototypeToken.width).toBe(0.5);
    expect(mock.npc.prototypeToken.height).toBe(0.5);
  });
});
