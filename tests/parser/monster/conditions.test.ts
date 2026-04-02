vi.mock("../../../src/config/_module", async () => {
  const dict = await vi.importActual<any>("../../../src/config/dictionary/dictionary");
  return { SETTINGS: { MODULE_ID: "ddb-importer" }, DICTIONARY: dict.default };
});
vi.mock("../../../src/effects/_module", () => ({}));
vi.mock("../../../src/effects/DDBEffectHelper", () => ({ default: {} }));

import DDBMonster from "../../../src/parser/DDBMonster";
import "../../../src/parser/monster/conditions";
import { makeMockMonster } from "../../_fixtures/mockMonster";

describe("DDBMonster.getAdjustmentsConfig", () => {
  const getAdjustmentsConfig = DDBMonster.prototype.getAdjustmentsConfig;

  it("resistances returns type=1 adjustments", () => {
    const mock = makeMockMonster();
    const result = getAdjustmentsConfig.call(mock, "resistances");
    expect(Array.isArray(result)).toBe(true);
    result.forEach((adj: any) => expect(adj.type).toBe(1));
  });

  it("immunities returns type=2 adjustments", () => {
    const mock = makeMockMonster();
    const result = getAdjustmentsConfig.call(mock, "immunities");
    expect(Array.isArray(result)).toBe(true);
    result.forEach((adj: any) => expect(adj.type).toBe(2));
  });

  it("vulnerabilities returns type=3 adjustments", () => {
    const mock = makeMockMonster();
    const result = getAdjustmentsConfig.call(mock, "vulnerabilities");
    expect(Array.isArray(result)).toBe(true);
    result.forEach((adj: any) => expect(adj.type).toBe(3));
  });

  it("conditions returns condition config", () => {
    const mock = makeMockMonster();
    const result = getAdjustmentsConfig.call(mock, "conditions");
    expect(Array.isArray(result)).toBe(true);
    if (result.length > 0) {
      expect(result[0]).toHaveProperty("id");
      expect(result[0]).toHaveProperty("name");
    }
  });

  it("unknown type returns null", () => {
    const mock = makeMockMonster();
    const result = getAdjustmentsConfig.call(mock, "unknown");
    expect(result).toBeNull();
  });
});

describe("DDBMonster.getDamageAdjustments", () => {
  const getDamageAdjustments = DDBMonster.prototype.getDamageAdjustments;
  const getAdjustmentsConfig = DDBMonster.prototype.getAdjustmentsConfig;

  function makeDmgMock(adjustments: number[]) {
    const mock = makeMockMonster({ source: { damageAdjustments: adjustments } });
    mock.getAdjustmentsConfig = getAdjustmentsConfig;
    return mock;
  }

  it("no adjustments: empty result", () => {
    const mock = makeDmgMock([]);
    const result = getDamageAdjustments.call(mock, "resistances");

    expect(result.value).toEqual([]);
    expect(result.custom).toBe("");
  });

  it("fire resistance (id 9)", () => {
    const mock = makeDmgMock([9]);
    const result = getDamageAdjustments.call(mock, "resistances");

    expect(result.value).toContain("fire");
  });

  it("poison immunity (id 22)", () => {
    const mock = makeDmgMock([22]);
    const result = getDamageAdjustments.call(mock, "immunities");

    expect(result.value).toContain("poison");
  });

  it("multiple immunities: poison + psychic (ids 22, 28)", () => {
    const mock = makeDmgMock([22, 28]);
    const result = getDamageAdjustments.call(mock, "immunities");

    expect(result.value).toContain("poison");
    expect(result.value).toContain("psychic");
  });

  it("physical immunity with magic bypass (id 29)", () => {
    const mock = makeDmgMock([29]);
    const result = getDamageAdjustments.call(mock, "immunities");

    expect(result.value).toContain("bludgeoning");
    expect(result.value).toContain("piercing");
    expect(result.value).toContain("slashing");
    expect(result.bypasses).toContain("mgc");
  });

  it("unmatched adjustment id is ignored", () => {
    const mock = makeDmgMock([999999]);
    const result = getDamageAdjustments.call(mock, "resistances");

    expect(result.value).toEqual([]);
  });
});

describe("DDBMonster._generateDamageImmunities / _generateDamageResistances", () => {
  function makeDmgMock(adjustments: number[]) {
    const mock = makeMockMonster({ source: { damageAdjustments: adjustments } });
    mock.getAdjustmentsConfig = DDBMonster.prototype.getAdjustmentsConfig;
    mock.getDamageAdjustments = DDBMonster.prototype.getDamageAdjustments;
    return mock;
  }

  it("_generateDamageImmunities stores in npc.system.traits.di", () => {
    const mock = makeDmgMock([22]); // poison immunity
    DDBMonster.prototype._generateDamageImmunities.call(mock);

    expect(mock.npc.system.traits.di.value).toContain("poison");
  });

  it("_generateDamageResistances stores in npc.system.traits.dr", () => {
    const mock = makeDmgMock([9]); // fire resistance
    DDBMonster.prototype._generateDamageResistances.call(mock);

    expect(mock.npc.system.traits.dr.value).toContain("fire");
  });

  it("_generateDamageVulnerabilities stores in npc.system.traits.dv", () => {
    // vulnerabilities are type=3 in damageAdjustments
    // Looking at the data: there may not be standard vulnerability IDs in all configs
    const mock = makeDmgMock([]);
    DDBMonster.prototype._generateDamageVulnerabilities.call(mock);

    expect(mock.npc.system.traits.dv.value).toEqual([]);
  });
});

describe("DDBMonster._generateConditionImmunities", () => {
  it("maps condition IDs to foundry condition values", () => {
    const mock = makeMockMonster({
      source: {
        // Using actual condition IDs from CONFIG.DDB.conditions
        conditionImmunities: [4, 9, 11], // will be matched against CONFIG.DDB.conditions
      },
    });
    mock.getAdjustmentsConfig = DDBMonster.prototype.getAdjustmentsConfig;

    DDBMonster.prototype._generateConditionImmunities.call(mock);

    expect(mock.npc.system.traits.ci.value.length).toBeGreaterThan(0);
  });

  it("empty condition immunities", () => {
    const mock = makeMockMonster({ source: { conditionImmunities: [] } });
    mock.getAdjustmentsConfig = DDBMonster.prototype.getAdjustmentsConfig;

    DDBMonster.prototype._generateConditionImmunities.call(mock);

    expect(mock.npc.system.traits.ci.value).toEqual([]);
    expect(mock.npc.system.traits.ci.custom).toBe("");
  });
});
