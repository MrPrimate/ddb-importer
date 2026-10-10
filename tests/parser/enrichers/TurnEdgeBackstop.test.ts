// @vitest-environment jsdom
/**
 * Foundry 13 has no core turn-edge expiry: a source/target edge is ended by its DAE token and the
 * counted duration is only a backstop for times-up. An end edge needs two rounds, or times-up removes
 * "until the end of your next turn" at the start of that turn; the six-second stand-in parsed from a
 * "next turn" sentence must not replace it.
 */
import { DDBClassFeatureEnricher } from "../../../src/parser/enrichers/_module";
import DDBEnricherData from "../../../src/parser/enrichers/data/DDBEnricherData";
import DDBFeatureActivity from "../../../src/parser/activities/DDBFeatureActivity";
import { makeEnricherData } from "../../_fixtures/ddb/factories";
import { installActivityConfigStubs } from "../../_fixtures/ddb/stubs";

type TConstructor = new (options: ConstructorParameters<typeof DDBEnricherData>[0]) => DDBEnricherData;

/** Run the real hint consumer for one enricher and return the effects it builds. */
async function createEffects(Enricher: TConstructor, description: string, system: Record<string, unknown> = {}): Promise<any[]> {
  const name = "Turn Edge Fixture";
  const doc = {
    _id: "turnEdgeItem1234", name, type: "feat", img: "icons/svg/aura.svg",
    system: { description: { value: description }, activities: {}, ...system },
    flags: { ddbimporter: {} },
    effects: [],
  } as unknown as I5eFeatItem;
  const hints = makeEnricherData(Enricher, { name, data: doc, klass: "Bard", ddbParser: { originalName: name } });
  const factory = new DDBClassFeatureEnricher({ activityGenerator: DDBFeatureActivity });
  Object.assign(factory, {
    ddbParser: hints.ddbParser, document: doc, loadedEnricher: hints, name, is2014: false, is2024: true,
  });
  return factory.createEffects();
}

function hinted(options: IDDBEffectHint["options"], type?: IDDBEffectHint["type"]): TConstructor {
  return class extends DDBEnricherData {
    override get effects(): IDDBEffectHint[] {
      return [{ name: "Edge", options, ...(type ? { type } : {}) }];
    }
  } as unknown as TConstructor;
}

const NEXT_TURN = "<p>The target is Stunned until the end of your next turn.</p>";

beforeEach(() => {
  installActivityConfigStubs();
});

describe("Foundry 13 turn-edge backstop", () => {
  it("gives an end edge two rounds in place of the parsed next-turn stand-in", async () => {
    const [effect] = await createEffects(hinted({ expiry: "sourceEnd" }), NEXT_TURN);
    expect(effect.duration).toMatchObject({ seconds: 12, rounds: 2 });
  });

  it("gives a start edge with no duration in its text one round", async () => {
    const [effect] = await createEffects(hinted({ expiry: "targetStart" }), "<p>No duration here.</p>");
    expect(effect.duration).toMatchObject({ seconds: 6, rounds: 1 });
  });

  it("keeps an explicit counted duration", async () => {
    const [effect] = await createEffects(hinted({ expiry: "targetEnd", durationSeconds: 60 }), NEXT_TURN);
    expect(effect.duration.seconds).toBe(60);
  });

  it("raises a one-round duration a spell effect inherited to the end-edge backstop", async () => {
    const [effect] = await createEffects(
      hinted({ expiry: "sourceEnd" }, "spell"),
      "<p>A psychic jolt.</p>",
      { duration: { value: "1", units: "round" }, level: 0 },
    );
    expect(effect.duration).toMatchObject({ seconds: 12, rounds: 2 });
  });

  it("keeps a real duration parsed from the text beside an end edge", async () => {
    const [effect] = await createEffects(hinted({ expiry: "targetEnd" }), "<p>The target is cursed for 1 minute.</p>");
    expect(effect.duration.seconds).toBe(60);
  });
});
