/**
 * Pins for the Necromancer's Necromancy Spellbook (AU 2024): the Undead Familiar cast must be a
 * summon that spends a level 1 slot and must route through the companion factory's Find Familiar
 * summon data, creating the factory when the parser has not built one. The audit harness shows
 * the activity but has no monster packs, so the summon data itself is not visible there.
 */
const loggerMock = vi.hoisted(() => ({
  warn: vi.fn(),
  debug: vi.fn(),
  info: vi.fn(),
  error: vi.fn(),
  verbose: vi.fn(),
}));

vi.mock("../../../src/lib/_module", async () => ({
  logger: loggerMock,
  utils: (await vi.importActual<any>("../../../src/lib/Utils")).default,
}));
vi.mock("../../../src/parser/spells/CharacterSpellFactory", () => ({ default: class {} }));
vi.mock("../../../src/parser/spells/DDBSpell", () => ({ default: class {} }));
vi.mock("../../../src/parser/lib/_module", async () => ({
  DDBDataUtils: (await vi.importActual<any>("../../../src/parser/lib/DDBDataUtils")).default,
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

import NecromancySpellbook from "../../../src/parser/enrichers/class/wizard/NecromancySpellbook";
import { makeEnricherData } from "../../_fixtures/ddb/factories";
import { installActivityConfigStubs } from "../../_fixtures/ddb/stubs";

beforeAll(() => {
  installActivityConfigStubs();
});

function necromancer(ddbParser: Record<string, any> = {}): NecromancySpellbook {
  return makeEnricherData(NecromancySpellbook, {
    name: "Necromancy Spellbook",
    character: {
      classes: [{ level: 3, definition: { name: "Wizard" }, subclassDefinition: { name: "Necromancer" } }],
    },
    ddbParser,
  });
}

describe("Necromancy Spellbook Undead Familiar cast", () => {
  it("keeps the parsed default activity and adds a slot-consuming summon", () => {
    const enricher = necromancer();
    expect(enricher.type).toBeNull();
    const [cast, ...rest] = enricher.additionalActivities;
    expect(rest).toEqual([]);
    expect(cast.init).toEqual({ name: NecromancySpellbook.SUMMON_ACTIVITY_NAME, type: "summon" });
    expect(cast.overrides).toMatchObject({
      activationType: "hour",
      activationValue: 1,
      rangeType: "ft",
      rangeValue: 10,
      noTemplate: true,
      noConsumeTargets: true,
      addSpellSlotConsume: true,
      spellSlotConsumeTarget: "1",
      spellSlotConsumeValue: "1",
    });
  });

  it("fills the summon from the companion factory's Find Familiar data", async () => {
    const addCRSummoning = vi.fn();
    const enricher = necromancer({ ddbCompanionFactory: { addCRSummoning }, createCompanionFactory: vi.fn() });
    const activity = { _id: "abc", type: "summon" } as any;
    await enricher.additionalActivities[0].overrides!.func!({ activity });
    expect(addCRSummoning).toHaveBeenCalledWith(activity);
    expect((enricher.ddbParser as any).createCompanionFactory).not.toHaveBeenCalled();
  });

  it("creates the companion factory when the feature parser has none", async () => {
    const addCRSummoning = vi.fn();
    const enricher = necromancer({
      createCompanionFactory() {
        (this as any).ddbCompanionFactory = { addCRSummoning };
      },
    });
    const activity = { _id: "abc", type: "summon" } as any;
    await enricher.additionalActivities[0].overrides!.func!({ activity });
    expect(addCRSummoning).toHaveBeenCalledWith(activity);
  });
});
