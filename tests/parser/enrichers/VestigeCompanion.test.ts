/**
 * Pins for the Vestige Patron companion feature: the primary activity must be a summon so the
 * parsed vestige actor is linked as its profile, with the bonus-action command beside it.
 */
const loggerMock = vi.hoisted(() => ({
  warn: vi.fn(),
  debug: vi.fn(),
  info: vi.fn(),
  error: vi.fn(),
  verbose: vi.fn(),
}));

vi.mock("../../../src/lib/_module", () => ({ logger: loggerMock, utils: { capitalize: (s: string) => s } }));
vi.mock("../../../src/parser/spells/CharacterSpellFactory", () => ({ default: class {} }));
vi.mock("../../../src/parser/spells/DDBSpell", () => ({ default: class {} }));
vi.mock("../../../src/parser/lib/_module", () => ({
  DDBDataUtils: {
    findSubClassByFeatureId: vi.fn(),
    classIdentifierName: (name: string) => name,
    getLimitedUses: vi.fn(),
  },
  DDBTemplateStrings: {
    parse: vi.fn((_ddb: any, _raw: any, text: string) => ({ text })),
  },
}));
vi.mock("../../../src/parser/enrichers/effects/_module", async () => ({
  AutoEffects: { effectModules: () => ({ ac5eInstalled: false }) },
  EnchantmentEffects: {},
  ChangeHelper: (await vi.importActual<any>("../../../src/parser/enrichers/effects/ChangeHelper")).default,
  EffectGenerator: {},
}));

import VestigeCompanion from "../../../src/parser/enrichers/class/warlock/VestigeCompanion";
import { DICTIONARY } from "../../../src/config/_module";
import { makeEnricherData } from "../../_fixtures/ddb/factories";

describe("Vestige Companion", () => {
  it("summons the parsed vestige as its primary activity", () => {
    const enricher = makeEnricherData(VestigeCompanion, { name: "Vestige Companion", actions: null });
    expect(enricher.type).toBe("summon");
    expect(enricher.activity).toMatchObject({
      name: "Summon Vestige",
      activationType: "action",
      noConsumeTargets: true,
      data: { creatureSizes: ["sm"] },
    });
  });

  it("adds the bonus-action command beside DDB's per-form actions and folds the option's summon in", () => {
    const enricher = makeEnricherData(VestigeCompanion, { name: "Vestige Companion", actions: null });
    expect(enricher.additionalActivities).toEqual([
      expect.objectContaining({
        init: { name: "Command Vestige", type: "utility" },
        overrides: expect.objectContaining({ activationType: "bonus" }),
      }),
    ]);
    expect(enricher.useDefaultAdditionalActivities).toBe(true);
    expect(enricher.addToDefaultAdditionalActivities).toBe(true);
    expect(enricher.mergeChoiceActivities).toBe(true);
  });

  it("is wired as a companion feature whose option child keeps the name and builds typed actors", () => {
    expect(DICTIONARY.companions.COMPANION_FEATURES).toContain("Vestige Companion");
    expect(DICTIONARY.parsing.choiceFeatures.KEEP_CHOICE_FEATURE_NAME).toContain("Vestige Companion");
    expect(DICTIONARY.companions.MULTI_COMPANIONS_2024["Vestige Companion"]).toEqual(["Celestial", "Fiend", "Undead"]);
  });
});
