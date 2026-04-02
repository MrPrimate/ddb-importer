// Mock barrel re-exports to break circular dependency chains
vi.mock("../../../src/config/_module", async () => {
  const dict = await vi.importActual<any>("../../../src/config/dictionary/dictionary");
  return { SETTINGS: { MODULE_ID: "ddb-importer" }, DICTIONARY: dict.default };
});
vi.mock("../../../src/effects/_module", () => ({}));
vi.mock("../../../src/effects/DDBEffectHelper", () => ({ default: {} }));

import DDBCharacter from "../../../src/parser/DDBCharacter";
import "../../../src/parser/character/initiative";
import { makeMockCharacter } from "../../_fixtures/mockCharacter";

// =============================================================================
// _generateInitiative
// =============================================================================
describe("DDBCharacter._generateInitiative", () => {
  const generateInitiative = DDBCharacter.prototype._generateInitiative;

  it("no modifiers: ability dex, bonus empty", () => {
    const mock = makeMockCharacter();
    generateInitiative.call(mock);

    expect(mock.raw.character.system.attributes.init.ability).toBe("dex");
    expect(mock.raw.character.system.attributes.init.bonus).toBe("");
  });

  it("initiative bonuses in modifiers are excluded by effect system", () => {
    // Initiative bonuses ({ type: "bonus", subType: "initiative" }) are in
    // the "common" excluded modifiers list, so filterBaseModifiers with
    // default includeExcludedEffects=false filters them out.
    const mock = makeMockCharacter({
      ddbCharacter: {
        modifiers: {
          class: [],
          race: [
            {
              type: "bonus",
              subType: "initiative",
              value: 3,
              componentId: 100,
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
    generateInitiative.call(mock);

    // Modifier is excluded → bonus remains ""
    expect(mock.raw.character.system.attributes.init.bonus).toBe("");
  });

  it("writes to correct path on raw character", () => {
    const mock = makeMockCharacter();
    generateInitiative.call(mock);

    expect(mock.raw.character.system.attributes.init).toEqual({
      ability: "dex",
      bonus: "",
    });
  });

  it("works with empty modifiers object", () => {
    const mock = makeMockCharacter({
      ddbCharacter: {
        modifiers: { class: [], race: [], background: [], item: [], feat: [], condition: [] },
      },
    });
    generateInitiative.call(mock);

    expect(mock.raw.character.system.attributes.init.ability).toBe("dex");
    expect(mock.raw.character.system.attributes.init.bonus).toBe("");
  });
});
