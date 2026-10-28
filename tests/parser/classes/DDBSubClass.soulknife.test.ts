// @vitest-environment jsdom
/**
 * The Soulknife's Psychic Blades attacks are the "Psychic Blade" weapon: the subclass grants the
 * munched weapon at the feature's level and drops the blade's Dexterity / Strength choice.
 */
import "../../../src/parser/features/CharacterFeatureFactory";
import DDBSubClass from "../../../src/parser/classes/DDBSubClass";

function makeStub(subClassId: number, advancement: any[], index: any[], classFeatures: any[]): any {
  const stub: any = {
    data: { name: "Soulknife", system: { advancement } },
    ddbClassDefinition: { id: subClassId },
    classFeatures,
    _advancementMatches: { features: {} },
    _compendiums: { features: { index } },
  };
  stub._addAdvancement = DDBSubClass.prototype._addAdvancement;
  return stub;
}

describe("DDBSubClass._rogueFixes", () => {
  it.each([
    ["2024", 2190986],
    ["2014", 410],
  ])("grants the %s Soulknife its Psychic Blade weapon and drops the blade's ability choice", (_rules, subClassId) => {
    const feature = { id: 1, name: "Psychic Blades", requiredLevel: 3 };
    const stub = makeStub(subClassId, [
      { _id: "choice", type: "ItemChoice", title: "Psychic Blades" },
      { _id: "trait", type: "Trait", title: "Psychic Blades" },
    ], [
      { uuid: "Compendium.world.features.Item.bladeOther", name: "Psychic Blade", type: "weapon", flags: { ddbimporter: { subClassId: 1 } } },
      { uuid: "Compendium.world.features.Item.bladesFeat", name: "Psychic Blades", type: "feat", flags: { ddbimporter: { subClassId } } },
      { uuid: "Compendium.world.features.Item.blade00000", name: "Psychic Blade", type: "weapon", flags: { ddbimporter: { subClassId } } },
    ], [feature]);
    DDBSubClass.prototype._rogueFixes.call(stub);

    const advancements = stub.data.system.advancement as any[];
    expect(advancements.map((a) => a.type)).toEqual(["Trait", "ItemGrant"]);
    expect(advancements[1].level).toBe(3);
    expect(advancements[1].configuration.items.map((i: any) => i.uuid)).toEqual(["Compendium.world.features.Item.blade00000"]);
    expect(Object.values(stub._advancementMatches.features)).toEqual([{ "Psychic Blade": "Compendium.world.features.Item.blade00000" }]);
  });

  it("leaves a Soulknife with no munched Psychic Blade weapon without a grant", () => {
    const stub = makeStub(2190986, [], [], []);
    DDBSubClass.prototype._rogueFixes.call(stub);
    expect(stub.data.system.advancement).toHaveLength(0);
  });
});
