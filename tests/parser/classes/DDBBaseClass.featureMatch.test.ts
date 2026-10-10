// @vitest-environment jsdom
/**
 * getFeatureCompendiumMatch must find the class feature document, never one of its choice options.
 * DDB ships some 2024 subclass features twice under two ids (Path of the World Tree's Vitality of
 * the Tree as 10292408 and 13279415), so a name lookup finds both parent documents and the exact
 * pass must pick the one whose DDB id and name both match. Rows below mirror a munched compendium.
 */
import "../../../src/parser/features/CharacterFeatureFactory";
import DDBBaseClass from "../../../src/parser/classes/DDBBaseClass";
import logger from "../../../src/lib/Logger";

const SUBCLASS_ID = 2190890;

function row(_id: string, name: string, id: number, { optionId, originalName = name }: { optionId?: number; originalName?: string } = {}) {
  return {
    _id, name, uuid: `Compendium.world.features.Item.${_id}`,
    flags: { ddbimporter: {
      id, originalName, classId: 2190875, subClassId: SUBCLASS_ID,
      ...(optionId !== undefined ? { isChoice: true, dndbeyond: { choice: { optionId } } } : {}),
    } },
  };
}

const INDEX = [
  row("vitalityNew00000", "Vitality of the Tree", 13279415),
  row("vitalityOld00000", "Vitality of the Tree", 10292408),
  row("vitalityOpt00000", "Vitality of the Tree: Rage: Vitality of the Tree", 10292408, { optionId: 4496918 }),
  row("travelNew0000000", "Travel along the Tree", 13279421),
  row("travelOld0000000", "Travel along the Tree", 10292411),
  row("branches00000000", "Branches of the Tree", 10292410),
];

function parser(index: unknown[]) {
  return Object.assign(Object.create(DDBBaseClass.prototype) as DDBBaseClass, {
    isSubClass: true,
    ddbClassDefinition: { id: SUBCLASS_ID },
    _compendiums: { features: { index } },
    featureAdvancements: [] as I5eAdvancement[],
    featureAdvancementUuids: new Set(),
    _advancementMatches: { features: {} },
  });
}

const feature = (id: number, name: string) => ({ id, name, requiredLevel: 3, description: "" }) as IDDBClassDefinitionFeature;

afterEach(() => vi.restoreAllMocks());

describe("DDBBaseClass.getFeatureCompendiumMatch", () => {
  it("resolves each DDB copy of a twice-shipped feature to its own document", () => {
    const error = vi.spyOn(logger, "error").mockImplementation(() => undefined);
    const p = parser(INDEX);
    expect(p.getFeatureCompendiumMatch(feature(10292408, "Vitality of the Tree"))?._id).toBe("vitalityOld00000");
    expect(p.getFeatureCompendiumMatch(feature(13279415, "Vitality of the Tree"))?._id).toBe("vitalityNew00000");
    expect(p.getFeatureCompendiumMatch(feature(10292411, "Travel along the Tree"))?._id).toBe("travelOld0000000");
    expect(error).not.toHaveBeenCalled();
  });

  it("still finds a feature with one document", () => {
    expect(parser(INDEX).getFeatureCompendiumMatch(feature(10292410, "Branches of the Tree"))?._id).toBe("branches00000000");
  });

  it("reports an ambiguity it cannot break by id", () => {
    const error = vi.spyOn(logger, "error").mockImplementation(() => undefined);
    // neither copy carries the looked-up id
    expect(parser(INDEX).getFeatureCompendiumMatch(feature(99999999, "Vitality of the Tree"))).toBeNull();
    expect(error).toHaveBeenCalledOnce();
  });

  it("grants a twice-shipped feature once at its level", async () => {
    const p = parser(INDEX);
    await p._generateFeatureAdvancementFromCompendiumMatch(feature(13279415, "Vitality of the Tree"));
    await p._generateFeatureAdvancementFromCompendiumMatch(feature(10292408, "Vitality of the Tree"));
    await p._generateFeatureAdvancementFromCompendiumMatch(feature(10292410, "Branches of the Tree"));
    expect(p.featureAdvancements).toHaveLength(1);
    expect((p.featureAdvancements[0].configuration as I5eAdvItemGrantConfig).items!.map((i: any) => i.uuid)).toEqual([
      "Compendium.world.features.Item.vitalityNew00000",
      "Compendium.world.features.Item.branches00000000",
    ]);
  });
});
