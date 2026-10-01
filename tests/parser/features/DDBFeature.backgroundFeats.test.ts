// @vitest-environment jsdom
/**
 * A background's granted feat entry offering several feats is a choice. The background muncher's
 * mule never picks one and a new character may not have, and the background still needs its
 * ItemChoice so the player can pick in Foundry.
 */
import "../../../src/parser/features/CharacterFeatureFactory";
import DDBFeature from "../../../src/parser/features/DDBFeature";
import { CompendiumHelper } from "../../../src/lib/_module";

const FEATS = [
  { id: 11, name: "Example Feat (Strength)" },
  { id: 12, name: "Example Feat (Dexterity)" },
  { id: 13, name: "Single Feat" },
];

function asiFeat(componentId: number) {
  return { componentId, definition: { id: 99, name: "Example Ability Score Increase", categories: [{ tagName: "__INITIAL_ASI" }] } };
}

function background(grantedFeats: IDDBClassFeatureGrantedFeat[], feats: any[]): DDBFeature {
  return Object.assign(Object.create(DDBFeature.prototype) as DDBFeature, {
    ddbDefinition: { name: "Example Background", grantedFeats },
    ddbData: { character: { feats } },
    data: { system: {}, flags: {} },
    is2024: true,
  });
}

function advancements(feature: DDBFeature): any[] {
  return Object.values(feature.data.system.advancement ?? {});
}

describe("background feat advancements", () => {
  beforeEach(() => {
    const index = FEATS.map((feat) => ({ name: feat.name, uuid: `Compendium.test.feats.Item.f${feat.id}`, flags: { ddbimporter: { id: feat.id } } }));
    vi.spyOn(CompendiumHelper, "getCompendiumType").mockReturnValue({ index, getIndex: async () => index } as any);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("builds the choice for an unpicked multi-feat entry, with nothing to link", async () => {
    const feature = background([
      { id: 1, name: "Example Ability Score Increase", featIds: [99] },
      { id: 2, name: "Example Feat", featIds: [11, 12] },
    ], [asiFeat(1)]);
    await feature.buildBackgroundFeatAdvancements();
    expect(advancements(feature)).toEqual([expect.objectContaining({
      type: "ItemChoice",
      configuration: expect.objectContaining({
        pool: [{ uuid: "Compendium.test.feats.Item.f11" }, { uuid: "Compendium.test.feats.Item.f12" }],
      }),
    })]);
    expect(foundry.utils.getProperty(feature.data, "flags.ddbimporter.advancementLink")).toEqual([]);
  });

  it("links the picked feat of a choice", async () => {
    const feature = background([{ id: 2, name: "Example Feat", featIds: [11, 12] }],
      [{ componentId: 2, definition: { id: 12, name: "Example Feat (Dexterity)", categories: [] } }]);
    await feature.buildBackgroundFeatAdvancements();
    const [advancement] = advancements(feature);
    expect(advancement.type).toBe("ItemChoice");
    expect(foundry.utils.getProperty(feature.data, "flags.ddbimporter.advancementLink")).toEqual([
      { _id: advancement._id, features: { "Example Feat (Dexterity)": "Compendium.test.feats.Item.f12" } },
    ]);
  });

  it("grants an unpicked single feat and skips an unpicked ability score entry", async () => {
    const feature = background([
      { id: 1, name: "Example Ability Score Increase", featIds: [99] },
      { id: 3, name: "Single Feat", featIds: [13] },
    ], []);
    await feature.buildBackgroundFeatAdvancements();
    expect(advancements(feature)).toEqual([expect.objectContaining({
      type: "ItemGrant",
      configuration: expect.objectContaining({ items: [{ uuid: "Compendium.test.feats.Item.f13" }] }),
    })]);
  });
});
