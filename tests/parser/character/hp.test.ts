// Mock barrel re-exports to break circular dependency chains
vi.mock("../../../src/config/_module", async () => {
  const dict = await vi.importActual<any>("../../../src/config/dictionary/dictionary");
  return { SETTINGS: { MODULE_ID: "ddb-importer" }, DICTIONARY: dict.default };
});
vi.mock("../../../src/effects/_module", () => ({}));
vi.mock("../../../src/effects/DDBEffectHelper", () => ({ default: {} }));

import DDBCharacter from "../../../src/parser/DDBCharacter";
import "../../../src/parser/character/hp";
import { makeMockCharacter } from "../../_fixtures/mockCharacter";

// =============================================================================
// _generateHitPoints
// =============================================================================
describe("DDBCharacter._generateHitPoints", () => {
  const generateHP = DDBCharacter.prototype._generateHitPoints;

  it("basic HP: level 1, CON 10, base 10", () => {
    const mock = makeMockCharacter();
    generateHP.call(mock);

    // CON mod 0 × 1 level = 0, base 10 → HP = 10
    expect(mock.raw.character.system.attributes.hp.value).toBe(10);
    expect(mock.raw.character.system.attributes.hp.temp).toBe(0);
    expect(mock.raw.character.system.attributes.hp.tempmax).toBe(0);
  });

  it("CON modifier adds to HP per level", () => {
    const mock = makeMockCharacter({
      ddbCharacter: { baseHitPoints: 30 },
    });
    // Set CON to 14 (mod +2), totalLevels to 5
    mock.raw.character.flags.ddbimporter.dndbeyond.effectAbilities.con.value = 14;
    mock.raw.character.flags.ddbimporter.dndbeyond.totalLevels = 5;

    generateHP.call(mock);

    // CON mod +2 × 5 levels = 10, base 30 → HP = 40
    expect(mock.raw.character.system.attributes.hp.value).toBe(40);
  });

  it("bonus hit points (tempmax) are added to value", () => {
    const mock = makeMockCharacter({
      ddbCharacter: { baseHitPoints: 20, bonusHitPoints: 5 },
    });
    generateHP.call(mock);

    // HP = 20 + 0 (con) + 5 (bonus) = 25
    expect(mock.raw.character.system.attributes.hp.value).toBe(25);
    expect(mock.raw.character.system.attributes.hp.tempmax).toBe(5);
  });

  it("removed hit points are subtracted from value", () => {
    const mock = makeMockCharacter({
      ddbCharacter: { baseHitPoints: 20, removedHitPoints: 7 },
    });
    generateHP.call(mock);

    // HP = 20 - 7 = 13
    expect(mock.raw.character.system.attributes.hp.value).toBe(13);
  });

  it("temporary hit points stored in temp", () => {
    const mock = makeMockCharacter({
      ddbCharacter: { baseHitPoints: 20, temporaryHitPoints: 8 },
    });
    generateHP.call(mock);

    expect(mock.raw.character.system.attributes.hp.temp).toBe(8);
    // value is not affected by temp HP
    expect(mock.raw.character.system.attributes.hp.value).toBe(20);
  });

  it("override hit points replaces all calculation", () => {
    const mock = makeMockCharacter({
      ddbCharacter: { baseHitPoints: 50, overrideHitPoints: 100 },
    });
    mock.raw.character.flags.ddbimporter.dndbeyond.effectAbilities.con.value = 16;
    mock.raw.character.flags.ddbimporter.dndbeyond.totalLevels = 10;

    generateHP.call(mock);

    // Override ignores base + CON
    expect(mock.raw.character.system.attributes.hp.value).toBe(100);
    expect(mock.raw.character.system.attributes.hp.max).toBe(100);
  });

  it("per-level bonus from Tough feat (no class match)", () => {
    const mock = makeMockCharacter({
      ddbCharacter: {
        baseHitPoints: 20,
        modifiers: {
          class: [],
          race: [],
          background: [],
          item: [],
          feat: [
            {
              type: "bonus",
              subType: "hit-points-per-level",
              value: 2,
              componentId: 500,
              componentTypeId: 1,
              restriction: "",
              isGranted: true,
            },
          ],
          condition: [],
        },
      },
    });
    mock.raw.character.flags.ddbimporter.dndbeyond.totalLevels = 5;

    generateHP.call(mock);

    // HP modifiers are in the "common" exclusion list, so only the
    // includeExcludedEffects=true path picks them up.
    // Tough: 2 × 5 levels = 10, base 20, CON 0 → HP = 30
    expect(mock.raw.character.system.attributes.hp.value).toBe(30);
  });

  it("per-level bonus from class feature (class match)", () => {
    const mock = makeMockCharacter({
      ddbCharacter: {
        baseHitPoints: 20,
        classes: [
          {
            level: 3,
            definition: { id: 1, name: "Fighter", classFeatures: [] },
            subclassDefinition: null,
            classFeatures: [
              { definition: { id: 500, entityTypeId: 1, requiredLevel: 1 } },
            ],
            isStartingClass: true,
          },
        ],
        modifiers: {
          class: [
            {
              type: "bonus",
              subType: "hit-points-per-level",
              value: 1,
              componentId: 500,
              componentTypeId: 1,
              restriction: "",
              isGranted: true,
            },
          ],
          race: [],
          background: [],
          item: [],
          feat: [],
          condition: [],
        },
        options: { class: [], race: [], feat: [] },
        choices: { class: [] },
        optionalClassFeatures: [],
      },
    });
    mock.raw.character.flags.ddbimporter.dndbeyond.totalLevels = 5;

    generateHP.call(mock);

    // Class level = 3, so per-level bonus = 1 × 3 = 3
    // base 20 + CON 0 + 3 = 23
    expect(mock.raw.character.system.attributes.hp.value).toBe(23);
  });

  it("fixed hit-points bonus (not per-level)", () => {
    const mock = makeMockCharacter({
      ddbCharacter: {
        baseHitPoints: 20,
        modifiers: {
          class: [],
          race: [
            {
              type: "bonus",
              subType: "hit-points",
              value: 5,
              componentId: 600,
              componentTypeId: 1,
              restriction: "",
              isGranted: true,
            },
          ],
          background: [],
          item: [],
          feat: [],
          condition: [],
        },
      },
    });

    generateHP.call(mock);

    // Fixed bonus picked up via includeExcludedEffects=true path
    expect(mock.raw.character.flags.ddbimporter.fixedBonusHitPointValuesWithEffects).toBe(5);
  });

  it("stores metadata flags", () => {
    const mock = makeMockCharacter({
      ddbCharacter: { baseHitPoints: 25, removedHitPoints: 3 },
    });
    generateHP.call(mock);

    expect(mock.raw.character.flags.ddbimporter.baseHitPoints).toBe(25);
    expect(mock.raw.character.flags.ddbimporter.removedHitPoints).toBe(3);
    expect(mock.raw.character.flags.ddbimporter.rolledHP).toBe(false);
  });

  it("rolled HP preference sets rolledHP flag", () => {
    const mock = makeMockCharacter({
      ddbCharacter: { baseHitPoints: 20, preferences: { hitPointType: 2 } },
    });
    generateHP.call(mock);

    expect(mock.raw.character.flags.ddbimporter.rolledHP).toBe(true);
  });

  it("bonuses.level and bonuses.overall empty when no per-level modifiers", () => {
    const mock = makeMockCharacter({ ddbCharacter: { baseHitPoints: 15 } });
    generateHP.call(mock);

    expect(mock.raw.character.system.attributes.hp.bonuses.level).toBe("");
    expect(mock.raw.character.system.attributes.hp.bonuses.overall).toBe("");
  });

  it("negative CON modifier reduces HP", () => {
    const mock = makeMockCharacter({
      ddbCharacter: { baseHitPoints: 10 },
    });
    mock.raw.character.flags.ddbimporter.dndbeyond.effectAbilities.con.value = 8;
    mock.raw.character.flags.ddbimporter.dndbeyond.totalLevels = 3;

    generateHP.call(mock);

    // CON mod -1 × 3 = -3, base 10 → HP = 7
    expect(mock.raw.character.system.attributes.hp.value).toBe(7);
  });
});
