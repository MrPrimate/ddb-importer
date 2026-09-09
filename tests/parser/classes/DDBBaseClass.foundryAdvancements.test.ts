// @vitest-environment jsdom
// Pins the compendium scale-value copy: dnd5e's own class documents ship scale values with an
// empty identifier, and dnd5e 6 stores the advancement name as `name` (the pre-6.0 `title` is
// migrated away), so the dedupe against the generated scale must resolve identifiers the way the
// system does or a class ends up with two `sneak-attack` scale values.

// the class parsers sit in an import cycle with AdvancementHelper; loading the feature
// factory first resolves it the way the production entry point does
import "../../../src/parser/features/CharacterFeatureFactory";
import DDBBaseClass from "../../../src/parser/classes/DDBBaseClass";
import DDBSubClass from "../../../src/parser/classes/DDBSubClass";
import CompendiumHelper from "../../../src/lib/CompendiumHelper";

function makeClassStub(name: string, advancements: any[]): any {
  const stub: any = {
    data: { name, system: { advancement: {} } },
    name,
    is2014: false,
    is2024: true,
  };
  Object.defineProperty(stub, "_advancementData", {
    get() {
      return stub.data.system.advancement;
    },
  });
  stub._addAdvancement = DDBSubClass.prototype._addAdvancement;
  stub._addAdvancements = DDBSubClass.prototype._addAdvancements;
  stub._addAdvancements(advancements);
  return stub;
}

function fakePack(advancement: Record<string, any>): any {
  return {
    collection: "dnd5e.classes24",
    getIndex: async () => undefined,
    index: [{ _id: "rogue00000000000", name: "Rogue", type: "class" }],
    getDocument: async () => ({ _source: { system: { advancement } } }),
  };
}

describe("DDBBaseClass.scaleValueIdentifier", () => {
  it("prefers the configured identifier and otherwise slugs the dnd5e 6 name or legacy title", () => {
    expect(DDBBaseClass.scaleValueIdentifier({ configuration: { identifier: "sneak-attack" }, name: "Other" } as any)).toBe("sneak-attack");
    expect(DDBBaseClass.scaleValueIdentifier({ configuration: { identifier: "" }, name: "Sneak Attack" } as any)).toBe("sneak-attack");
    expect(DDBBaseClass.scaleValueIdentifier({ configuration: {}, title: "Sneak Attack" } as any)).toBe("sneak-attack");
  });
});

describe("DDBBaseClass._addFoundryAdvancements", () => {
  const originalGetCompendium = CompendiumHelper.getCompendium;
  let pack: any = null;

  beforeEach(() => {
    CompendiumHelper.getCompendium = ((id: string) => (id === "dnd5e.classes24" ? pack : null)) as any;
  });

  afterEach(() => {
    CompendiumHelper.getCompendium = originalGetCompendium;
  });

  const generatedSneakAttack = {
    _id: "ddbSneakAttack00",
    type: "ScaleValue",
    name: "Sneak Attack",
    configuration: { identifier: "sneak-attack", type: "dice", scale: { 1: { number: 1, faces: 6 } } },
  };

  it("skips a system scale value whose empty identifier resolves to a generated one (dnd5e 6 name)", async () => {
    pack = fakePack({
      sneak: { _id: "4uOxepnMxb2TYDY4", type: "ScaleValue", name: "Sneak Attack", configuration: { identifier: "", type: "dice", scale: {} } },
      other: { _id: "otherScale000000", type: "ScaleValue", name: "Stroke Dice", configuration: { identifier: "", type: "number", scale: {} } },
      grant: { _id: "grant00000000000", type: "ItemGrant", name: "Expertise" },
    });
    const stub = makeClassStub("Rogue", [generatedSneakAttack]);
    await DDBBaseClass.prototype._addFoundryAdvancements.call(stub);

    const ids = Object.keys(stub.data.system.advancement);
    expect(ids).toEqual(["ddbSneakAttack00", "otherScale000000"]);
  });

  it("still dedupes a pre-6.0 document that carries title instead of name", async () => {
    pack = fakePack({
      sneak: { _id: "4uOxepnMxb2TYDY4", type: "ScaleValue", title: "Sneak Attack", configuration: { identifier: "", type: "dice", scale: {} } },
    });
    const stub = makeClassStub("Rogue", [generatedSneakAttack]);
    await DDBBaseClass.prototype._addFoundryAdvancements.call(stub);
    expect(Object.keys(stub.data.system.advancement)).toEqual(["ddbSneakAttack00"]);
  });
});
