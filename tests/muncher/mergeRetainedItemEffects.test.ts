import DDBCharacterImporter from "../../src/muncher/DDBCharacterImporter";

function makeEffect(id: string | undefined, name: string, extra: Record<string, any> = {}) {
  return { ...(id ? { _id: id } : {}), name, disabled: false, ...extra } as any;
}

describe("DDBCharacterImporter.mergeRetainedItemEffects", () => {

  it("gives a retained effect the id of the generated effect it replaces", () => {
    // the reimported activity links the generated id, so the retained copy must take it over
    const generated = [makeEffect("generatedShield1", "Shield")];
    const retained = [makeEffect("previousShield11", "Shield", { disabled: true })];

    const merged = DDBCharacterImporter.mergeRetainedItemEffects(generated, retained);

    expect(merged).toHaveLength(1);
    expect(merged[0]._id).toBe("generatedShield1");
    expect(merged[0].disabled).toBe(true);
  });

  it("keeps generated effects without a retained counterpart", () => {
    const generated = [makeEffect("generatedShield1", "Shield"), makeEffect("generatedRider11", "Shield Rider")];
    const retained = [makeEffect("previousShield11", "Shield")];

    const merged = DDBCharacterImporter.mergeRetainedItemEffects(generated, retained);

    expect(merged.map((e) => e._id)).toEqual(["generatedShield1", "generatedRider11"]);
  });

  it("keeps custom retained effects with their own id unless a generated effect holds it", () => {
    const generated = [makeEffect("sharedIdIIIIIIII", "Shield")];
    const retained = [
      makeEffect("customEffect1111", "My Custom Bonus"),
      makeEffect("sharedIdIIIIIIII", "Renamed Effect"),
    ];

    const merged = DDBCharacterImporter.mergeRetainedItemEffects(generated, retained);

    expect(merged.map((e) => e.name)).toEqual(["Shield", "My Custom Bonus", "Renamed Effect"]);
    expect(merged[1]._id).toBe("customEffect1111");
    expect(merged[2]._id).toBeUndefined();
  });

  it("matches same-named effects in order", () => {
    const generated = [makeEffect("generatedFirst11", "Aura"), makeEffect("generatedSecond1", "Aura")];
    const retained = [makeEffect("previousFirst111", "Aura", { img: "first.webp" }), makeEffect("previousSecond11", "Aura", { img: "second.webp" })];

    const merged = DDBCharacterImporter.mergeRetainedItemEffects(generated, retained);

    expect(merged.map((e) => [e._id, e.img])).toEqual([["generatedFirst11", "first.webp"], ["generatedSecond1", "second.webp"]]);
  });

  it("does not mutate the retained source effects", () => {
    const retained = [makeEffect("previousShield11", "Shield")];

    DDBCharacterImporter.mergeRetainedItemEffects([makeEffect("generatedShield1", "Shield")], retained);

    expect(retained[0]._id).toBe("previousShield11");
  });

});
