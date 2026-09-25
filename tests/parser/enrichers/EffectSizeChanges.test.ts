/**
 * dnd5e 5.3 stores `system.traits.size` as a key ("med", "lg", ...), not a number, so an "add"
 * change on it concatenates ("med1") and leaves the actor with an invalid size. These pin the
 * enrichers that resize, and the shape any size change on this branch has to take.
 *
 * The vi.mock preamble matches CharacterAc5eOptinEnrichers.test.ts; ChangeHelper is real because
 * it builds the change objects under test.
 */
const loggerMock = vi.hoisted(() => ({
  warn: vi.fn(), debug: vi.fn(), info: vi.fn(), error: vi.fn(), verbose: vi.fn(),
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
  AutoEffects: { effectModules: () => ({}) },
  EnchantmentEffects: {},
  ChangeHelper: (await vi.importActual<any>("../../../src/parser/enrichers/effects/ChangeHelper")).default,
  EffectGenerator: {},
}));

import EnlargeReduce from "../../../src/parser/enrichers/spell/EnlargeReduce";
import GrotesqueGrowth from "../../../src/parser/enrichers/class/pugilist/GrotesqueGrowth";
import { makeEnricherData } from "../../_fixtures/ddb/factories";
import { installActivityConfigStubs } from "../../_fixtures/ddb/stubs";

// the roll-mode helpers (advantageAbilitySaveChange etc.) read CONFIG.Dice.D20Roll.ADV_MODE
beforeAll(() => {
  installActivityConfigStubs();
});

const SIZE_KEY = "system.traits.size";
const VALID_SIZES = ["tiny", "sm", "med", "lg", "huge", "grg"];

function hintsOf(Enricher: new (options: any) => any, options: any = {}): any[] {
  return makeEnricherData(Enricher, { name: "Test", actions: null, ...options }).effects as any[];
}

function sizeChanges(hints: any[]): any[] {
  return hints.flatMap((hint) => (hint.changes ?? []).filter((c: any) => c.key === SIZE_KEY));
}

describe("actor size changes on dnd5e 5.3", () => {

  it("Enlarge/Reduce does not try to step size with a change", () => {
    // the step is relative to whatever the target already is, so no static change can express it
    expect(sizeChanges(hintsOf(EnlargeReduce))).toEqual([]);
  });

  it("Enlarge/Reduce resizes the token with core token changes", () => {
    const hints = hintsOf(EnlargeReduce);
    const enlarged = hints.find((hint) => hint.name === "Enlarged");
    const reduced = hints.find((hint) => hint.name === "Reduced");
    expect(enlarged.changes.filter((c: any) => c.key.startsWith("token.")).map((c: any) => [c.key, c.type]))
      .toEqual([["token.width", "add"], ["token.height", "add"]]);
    expect(reduced.changes.filter((c: any) => c.key.startsWith("token.")).map((c: any) => [c.key, c.type]))
      .toEqual([["token.width", "subtract"], ["token.height", "subtract"]]);
  });

  it("Enlarge/Reduce still carries both damage bonuses and the Strength modifiers", () => {
    const hints = hintsOf(EnlargeReduce);
    const enlarged = hints.find((hint) => hint.name === "Enlarged");
    const reduced = hints.find((hint) => hint.name === "Reduced");
    expect(enlarged.changes.map((c: any) => [c.key, c.value, c.type])).toEqual(
      expect.arrayContaining([
        ["system.bonuses.mwak.damage", "1d4", "add"],
        ["system.bonuses.rwak.damage", "1d4", "add"],
      ]),
    );
    expect(reduced.changes.map((c: any) => [c.key, c.value, c.type])).toEqual(
      expect.arrayContaining([
        ["system.bonuses.mwak.damage", "1d4", "subtract"],
        ["system.bonuses.rwak.damage", "1d4", "subtract"],
      ]),
    );
  });

  it("Grotesque Growth sets a valid size key rather than adding to it", () => {
    const changes = sizeChanges(hintsOf(GrotesqueGrowth));
    expect(changes).toHaveLength(1);
    expect(changes[0].type).toBe("override");
    expect(VALID_SIZES).toContain(changes[0].value);
  });

});
