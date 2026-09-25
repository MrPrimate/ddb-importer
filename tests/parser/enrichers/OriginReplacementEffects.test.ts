// @vitest-environment jsdom
/**
 * `originReplacement` on an effect hint stamps `replacement: "origin"` on its roll-data changes,
 * for embedded effects an activity applies as well as standalone region effects, so caster-derived
 * values (@prof) resolve against the illrigger rather than the creature the effect lands on.
 */
import { ClassEnrichers, DDBClassFeatureEnricher } from "../../../src/parser/enrichers/_module";
import DDBEnricherData from "../../../src/parser/enrichers/data/DDBEnricherData";
import DDBFeatureActivity from "../../../src/parser/activities/DDBFeatureActivity";
import { makeEnricherData } from "../../_fixtures/ddb/factories";
import { installActivityConfigStubs } from "../../_fixtures/ddb/stubs";

type TConstructor = new (options: ConstructorParameters<typeof DDBEnricherData>[0]) => DDBEnricherData;

/** Run the real hint consumer for one enricher and return the effects it builds. */
async function createEffects(Enricher: TConstructor, name: string): Promise<I5eEffectData[]> {
  const doc = {
    _id: "originItem123456", name, type: "feat", img: "icons/svg/aura.svg",
    system: { description: { value: "Origin replacement fixture." }, activities: {} },
    flags: { ddbimporter: {} },
    effects: [],
  } as unknown as I5eFeatItem;
  const hints = makeEnricherData(Enricher, { name, data: doc, klass: "Illrigger", ddbParser: { originalName: name } });
  const factory = new DDBClassFeatureEnricher({ activityGenerator: DDBFeatureActivity });
  Object.assign(factory, {
    ddbParser: hints.ddbParser, document: doc, loadedEnricher: hints, name, is2014: false, is2024: true,
  });
  return factory.createEffects();
}

beforeEach(() => {
  installActivityConfigStubs();
});

describe("originReplacement on embedded effects", () => {
  it("stamps origin replacement on an activity-applied effect's roll-data changes", async () => {
    const effects = await createEffects(ClassEnrichers.Illrigger.Bedevil as unknown as TConstructor, "Bedevil");
    expect(effects).toHaveLength(1);
    expect(effects[0].system!.changes![0]).toMatchObject({
      key: "system.rolls.ability.save.bonus",
      value: "-@prof",
      replacement: "origin",
    });
  });

  it("leaves changes alone on a hint without originReplacement", async () => {
    const effects = await createEffects(ClassEnrichers.Illrigger.ShadowShroud as unknown as TConstructor, "Shadow Shroud");
    expect(effects[0].system!.changes![0].replacement).toBeUndefined();
  });

  it("resolves the Soul's Doom damage modification against the illrigger", async () => {
    const effects = await createEffects(ClassEnrichers.Illrigger.SoulsDoom as unknown as TConstructor, "Soul's Doom");
    const change = effects[0].system!.changes!.find((c) => c.key === "system.traits.dm.amount.ALL");
    expect(change).toMatchObject({ value: "+@prof", replacement: "origin" });
  });
});
