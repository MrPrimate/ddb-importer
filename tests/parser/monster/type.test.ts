vi.mock("../../../src/config/_module", async () => {
  const dict = await vi.importActual<any>("../../../src/config/dictionary/dictionary");
  return { SETTINGS: { MODULE_ID: "ddb-importer" }, DICTIONARY: dict.default };
});
vi.mock("../../../src/effects/_module", () => ({}));
vi.mock("../../../src/effects/DDBEffectHelper", () => ({ default: {} }));

import DDBMonster from "../../../src/parser/DDBMonster";
import "../../../src/parser/monster/type";
import "../../../src/parser/monster/size"; // needed for getSizeFromId
import { makeMockMonster } from "../../_fixtures/mockMonster";

describe("DDBMonster._generateType", () => {
  const generateType = DDBMonster.prototype._generateType;

  function makeTypeMock(overrides: any = {}) {
    const mock = makeMockMonster(overrides);
    mock.getSizeFromId = DDBMonster.prototype.getSizeFromId;
    return mock;
  }

  it("sets beast type", () => {
    // typeId 2 = Beast in CONFIG.DDB.monsterTypes
    const mock = makeTypeMock({ source: { typeId: 2, subTypes: [] } });
    generateType.call(mock);

    expect(mock.npc.system.details.type.value).toBe("beast");
    expect(mock.typeName).toBe("Beast");
  });

  it("sets undead type", () => {
    // typeId 16 = Undead in CONFIG.DDB.monsterTypes
    const mock = makeTypeMock({ source: { typeId: 16, subTypes: [] } });
    generateType.call(mock);

    expect(mock.npc.system.details.type.value).toBe("undead");
  });

  it("sets construct type", () => {
    // typeId 4 = Construct
    const mock = makeTypeMock({ source: { typeId: 4, subTypes: [] } });
    generateType.call(mock);

    expect(mock.npc.system.details.type.value).toBe("construct");
  });

  it("sets dragon type", () => {
    // typeId 6 = Dragon
    const mock = makeTypeMock({ source: { typeId: 6, subTypes: [] } });
    generateType.call(mock);

    expect(mock.npc.system.details.type.value).toBe("dragon");
  });

  it("sets fiend type", () => {
    // typeId 9 = Fiend
    const mock = makeTypeMock({ source: { typeId: 9, subTypes: [] } });
    generateType.call(mock);

    expect(mock.npc.system.details.type.value).toBe("fiend");
  });

  it("sets subtypes from CONFIG.DDB.monsterSubTypes", () => {
    // subTypes are IDs that map to CONFIG.DDB.monsterSubTypes
    const mock = makeTypeMock({
      source: { typeId: 9, subTypes: [9] }, // 9 = demon
    });
    generateType.call(mock);

    expect(mock.npc.system.details.type.subtype).toContain("Demon");
  });

  it("empty subTypes produces empty subtype string", () => {
    const mock = makeTypeMock({ source: { typeId: 2, subTypes: [] } });
    generateType.call(mock);

    expect(mock.npc.system.details.type.subtype).toBe("");
  });

  it("sets custom for unknown type", () => {
    const mock = makeTypeMock({ source: { typeId: 99999, subTypes: [] } });
    generateType.call(mock);

    expect(mock.npc.system.details.type.custom).toBe("Unknown");
    expect(mock.typeName).toBe("Unknown Monster");
  });

  it("handles swarm with sizeId", () => {
    const mock = makeTypeMock({
      source: {
        typeId: 2,
        subTypes: [],
        swarm: { sizeId: 2 }, // Tiny swarm
      },
    });
    generateType.call(mock);

    expect(mock.npc.system.details.type.swarm).toBe("tiny");
  });

  it("null swarm is ignored", () => {
    const mock = makeTypeMock({ source: { typeId: 2, subTypes: [], swarm: null } });
    generateType.call(mock);

    expect(mock.npc.system.details.type.swarm).toBe("");
  });
});
