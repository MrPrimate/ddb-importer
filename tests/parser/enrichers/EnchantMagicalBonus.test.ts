// @vitest-environment jsdom
/**
 * `magicalBonus` on an enchant effect hint: a hint without a `bonus` (Pact of the Blade, Sacred
 * Weapon) only renames the weapon and makes it magical. It must not emit a system.magicalBonus
 * change, which Foundry rejects at apply time when the value is the text "undefined".
 */
import { ClassEnrichers, DDBClassFeatureEnricher } from "../../../src/parser/enrichers/_module";
import DDBEnricherData from "../../../src/parser/enrichers/data/DDBEnricherData";
import DDBFeatureActivity from "../../../src/parser/activities/DDBFeatureActivity";
import { makeEnricherData } from "../../_fixtures/ddb/factories";
import { installActivityConfigStubs } from "../../_fixtures/ddb/stubs";

type TConstructor = new (options: ConstructorParameters<typeof DDBEnricherData>[0]) => DDBEnricherData;

/** Run the real hint consumer for one enricher and return the effects it builds. */
async function createEffects(Enricher: TConstructor, name: string, klass = "Warlock"): Promise<I5eEffectData[]> {
  const doc = {
    _id: "enchantItem12345", name, type: "feat", img: "icons/svg/aura.svg",
    system: { description: { value: "Magical bonus fixture." }, activities: {} },
    flags: { ddbimporter: {} },
    effects: [],
  } as unknown as I5eFeatItem;
  const hints = makeEnricherData(Enricher, { name, data: doc, klass, ddbParser: { originalName: name } });
  const factory = new DDBClassFeatureEnricher({ activityGenerator: DDBFeatureActivity });
  Object.assign(factory, {
    ddbParser: hints.ddbParser, document: doc, loadedEnricher: hints, name, is2014: false, is2024: true,
  });
  return factory.createEffects();
}

class BonusEnchant extends DDBEnricherData {
  override get effects(): IDDBEffectHint[] {
    return [
      { type: "enchant", name: "Plus Two", magicalBonus: { makeMagical: true, bonus: 2 } },
      { type: "enchant", name: "No Bonus", magicalBonus: { makeMagical: true, nameAddition: "Bonded" } },
    ];
  }
}

function bonusChanges(effect: I5eEffectData) {
  return (effect.system?.changes ?? []).filter((c) => c.key === "system.magicalBonus");
}

beforeEach(() => {
  installActivityConfigStubs();
});

describe("enchant magicalBonus hints", () => {
  it("emits the magical bonus override only when the hint carries a bonus", async () => {
    const effects = await createEffects(BonusEnchant as unknown as TConstructor, "Bonus Enchant");
    const plus = effects.find((e) => e.name === "Plus Two")!;
    const none = effects.find((e) => e.name === "No Bonus")!;
    expect(bonusChanges(plus)).toEqual([expect.objectContaining({ type: "override", value: "2" })]);
    expect(bonusChanges(none)).toEqual([]);
    expect(none.system!.changes).toContainEqual(expect.objectContaining({ key: "name", value: "{}, Bonded" }));
    expect(none.system!.changes).toContainEqual(expect.objectContaining({ key: "system.properties", value: "mgc" }));
  });

  it("gives the Pact of the Blade weapon no magical bonus change", async () => {
    const effects = await createEffects(
      ClassEnrichers.Warlock.InvocationPactOfTheBlade as unknown as TConstructor, "Pact of the Blade",
    );
    const pact = effects.find((e) => e.name === "Pact Weapon")!;
    expect(pact).toBeDefined();
    expect(bonusChanges(pact)).toEqual([]);
  });
});
