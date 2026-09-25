import DDBMonster from "../../../src/parser/DDBMonster";
import "../../../src/parser/monster/size";
import { logger } from "../../../src/lib/_module";
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

  it("falls back to Medium for an unknown sizeId", () => {
    const mock = makeMockMonster();
    const result = getSizeFromId.call(mock, 999);
    expect(result.name).toBe("Medium");
    expect(result.value).toBe("med");
    expect(result.size).toBe(1);
  });

  it("keeps Medium as the default for combined sizes without an unknown-size warning", () => {
    const warn = vi.spyOn(logger, "warn");
    try {
      const mock = makeMockMonster();
      expect(getSizeFromId.call(mock, 10)).toEqual({ name: "Medium", value: "med", size: 1, id: 10, scale: 1 });
      expect(warn).not.toHaveBeenCalled();
    } finally {
      warn.mockRestore();
    }
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

  it("imports Medium or Small as Medium with a disabled Small effect", () => {
    const mock = makeMockMonster({ source: { sizeId: 10 } });
    mock.getSizeFromId = DDBMonster.prototype.getSizeFromId;
    generateSize.call(mock);

    expect(mock.npc.system.traits.size).toBe("med");
    expect(mock.npc.prototypeToken).toMatchObject({
      width: 1,
      height: 1,
      texture: { scaleX: 1, scaleY: 1 },
    });
    expect(mock.npc.effects).toEqual([expect.objectContaining({
      _id: expect.stringMatching(/^[a-zA-Z0-9]{16}$/),
      name: "Size: Small",
      type: "base",
      disabled: true,
      transfer: false,
      duration: { value: null, units: "seconds", expiry: null },
      flags: { ddbimporter: { disabled: true } },
      system: {
        changes: [{ key: "system.traits.size", type: "override", value: "sm", priority: 10 }],
      },
    })]);
  });

  it.each([
    ["Small or Medium", ["sm"]],
    ["Tiny, Small, Medium, or Large", ["tiny", "sm", "lg"]],
    ["Small, Small or Medium", ["sm"]],
    [" tiny , SMALL OR medium ", ["tiny", "sm"]],
    ["Large or Huge", ["lg", "huge"]],
  ])("creates one effect for each non-default size in %s", (name, expectedSizes) => {
    const sizes = CONFIG.DDB.creatureSizes;
    CONFIG.DDB.creatureSizes = [...sizes, { id: 100, entityTypeId: 127108918, name, weightType: 2 }];
    try {
      const mock = makeMockMonster({ source: { sizeId: 100 } });
      mock.getSizeFromId = DDBMonster.prototype.getSizeFromId;
      generateSize.call(mock);

      const effects: I5eEffectData[] = mock.npc.effects;
      expect(mock.npc.system.traits.size).toBe("med");
      expect(effects.map((effect) => effect.system?.changes?.[0].value)).toEqual(expectedSizes);
      expect(new Set(effects.map((effect) => effect._id)).size).toBe(effects.length);
      expect(effects.every((effect) => effect.disabled && !effect.transfer)).toBe(true);
    } finally {
      CONFIG.DDB.creatureSizes = sizes;
    }
  });

  it("preserves existing actor effects", () => {
    const existingEffect: I5eEffectData = { name: "Existing effect", disabled: false, system: { changes: [] } };
    const mock = makeMockMonster({ source: { sizeId: 10 }, npc: { effects: [existingEffect] } });
    mock.getSizeFromId = DDBMonster.prototype.getSizeFromId;
    generateSize.call(mock);

    expect(mock.npc.effects).toHaveLength(2);
    expect(mock.npc.effects[0]).toBe(existingEffect);
    expect(mock.npc.effects[0].disabled).toBe(false);
    expect(mock.npc.effects[1].name).toBe("Size: Small");
  });

  it.each([2, 3, 4, 5, 6, 7, 999])("adds no alternate-size effects for sizeId %i", (sizeId) => {
    const mock = makeMockMonster({ source: { sizeId }, npc: { effects: [] } });
    mock.getSizeFromId = DDBMonster.prototype.getSizeFromId;
    generateSize.call(mock);

    expect(mock.npc.effects).toEqual([]);
    if (sizeId === 999) {
      expect(mock.npc.system.traits.size).toBe("med");
      expect(mock.npc.prototypeToken).toMatchObject({
        width: 1,
        height: 1,
        texture: { scaleX: 1, scaleY: 1 },
      });
    }
  });
});
