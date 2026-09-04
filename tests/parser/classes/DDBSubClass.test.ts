// @vitest-environment jsdom
// Pins the hand-written subclass advancement fixes in DDBSubClass._fixes that no DDB
// data drives: they run against a minimal stand-in for the parser instance so the tests
// do not need a full character payload.

// the class parsers sit in an import cycle with AdvancementHelper; loading the feature
// factory first resolves it the way the production entry point does
import "../../../src/parser/features/CharacterFeatureFactory";
import AdvancementHelper from "../../../src/parser/advancements/AdvancementHelper";
import DDBSubClass from "../../../src/parser/classes/DDBSubClass";

function makeSubClassStub(name: string, { is2014 = false } = {}): any {
  const stub: any = {
    data: { name, system: { advancement: {} } },
    is2014,
    is2024: !is2014,
    spellLinks: [],
  };
  Object.defineProperty(stub, "_advancementData", {
    get() {
      return stub.data.system.advancement;
    },
  });
  stub._addAdvancement = DDBSubClass.prototype._addAdvancement;
  return stub;
}

describe("DDBSubClass._wizardFixes", () => {
  const originalLookup = AdvancementHelper.getCompendiumSpellUuidsFromNames;
  let requested: { names: string[]; use2024Spells: boolean }[] = [];

  beforeEach(() => {
    requested = [];
    AdvancementHelper.getCompendiumSpellUuidsFromNames = async (names, { use2024Spells = false } = {}) => {
      requested.push({ names, use2024Spells });
      return names.map((name) => {
        const id = name.replace(/\s/g, "");
        return { _id: id, name, img: "", uuid: `Compendium.test.spells.Item.${id}` };
      });
    };
  });

  afterEach(() => {
    AdvancementHelper.getCompendiumSpellUuidsFromNames = originalLookup;
  });

  it("grants Find Familiar to the 2024 Necromancer spellbook at level 3", async () => {
    const stub = makeSubClassStub("Necromancer");
    await DDBSubClass.prototype._wizardFixes.call(stub);

    const advancements = Object.values(stub.data.system.advancement) as any[];
    expect(advancements).toHaveLength(1);
    const [grant] = advancements;
    expect(grant.type).toBe("ItemGrant");
    expect(grant.title).toBe("Necromancy Spellbook");
    expect(grant.level).toBe(3);
    expect(grant.configuration.type).toBe("spell");
    expect(grant.configuration.items).toEqual([
      { uuid: "Compendium.test.spells.Item.FindFamiliar", optional: false },
    ]);
    // a spellbook entry, not an always-prepared spell
    expect(grant.configuration.spell).toMatchObject({
      method: "spell",
      prepared: CONFIG.DND5E.spellPreparationStates.unprepared.value,
      uses: { max: "", per: "", requireSlot: true },
    });
    expect(requested).toEqual([{ names: ["Find Familiar"], use2024Spells: true }]);
    expect(stub.spellLinks).toHaveLength(1);
    expect(stub.spellLinks[0]).toMatchObject({ type: "grant", advancementId: grant._id, level: 3 });
  });

  it("leaves the 2014 School of Necromancy alone", async () => {
    const stub = makeSubClassStub("School of Necromancy", { is2014: true });
    await DDBSubClass.prototype._wizardFixes.call(stub);
    expect(stub.data.system.advancement).toEqual({});
    expect(requested).toEqual([]);
  });

  it("ignores other wizard subclasses", async () => {
    const stub = makeSubClassStub("Evoker");
    await DDBSubClass.prototype._wizardFixes.call(stub);
    expect(stub.data.system.advancement).toEqual({});
  });
});
