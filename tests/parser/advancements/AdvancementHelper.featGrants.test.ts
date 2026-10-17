// @vitest-environment jsdom
// Pins the spell grant advancements AdvancementHelper.addSpellAdvancement builds from feature text:
// the level a grant applies at, whether its spell needs a slot, and the spellcasting abilities offered.
// The compendium lookup is replaced with made-up spells so no world is needed.

// the class parsers sit in an import cycle with AdvancementHelper; loading the feature
// factory first resolves it the way the production entry point does
import "../../../src/parser/features/CharacterFeatureFactory";
import AdvancementHelper from "../../../src/parser/advancements/AdvancementHelper";
import { installActivityConfigStubs } from "../../_fixtures/ddb/stubs";

const SPELL_LEVELS: Record<string, number> = {
  "example whisper": 0,
  "example bolt": 1,
  "example veil": 2,
  "example ward": 3,
};

function makeParser(type: string): any {
  return {
    ddbCharacter: {
      _spellParser: { _granted: { [type]: [] } },
      _ddbRace: { fullName: "Example Species" },
    },
    spellLinks: [],
    spellsGranted: { [type]: [] },
  };
}

function makeFeature(name: string, type: string, description: string): any {
  return {
    _id: "featureId0000000",
    name,
    type: "feat",
    system: {
      description: { value: description },
      advancement: {},
      activities: {},
      source: { rules: "2024" },
      uses: { max: "", spent: 0, recovery: [] },
    },
    flags: { ddbimporter: { type, originalName: name } },
  };
}

async function grantsFor(name: string, type: string, description: string) {
  const feature = makeFeature(name, type, description);
  // species traits keep their free casts on the grant, as CharacterFeatureFactory asks for them
  await AdvancementHelper.addSpellAdvancement({
    ddbParser: makeParser(type),
    feature,
    type: type as TGrantedSpellTypeOrigins,
    advancementsOnlyForLimitedUses: type === "race",
  });
  return Object.values(feature.system.advancement) as any[];
}

describe("AdvancementHelper.addSpellAdvancement grant levels, slots and abilities", () => {
  const originalLookup = AdvancementHelper.getCompendiumSpellUuidsFromNames;

  beforeAll(() => {
    // the free casts build cast activities
    installActivityConfigStubs();
  });

  beforeEach(() => {
    AdvancementHelper.getCompendiumSpellUuidsFromNames = async (names) => names
      .filter((name) => name.toLowerCase() in SPELL_LEVELS)
      .map((name) => {
        // the parser hands over lower cased names
        const id = name.replace(/\s/g, "");
        return { _id: id, name, img: "", uuid: `Compendium.test.spells.Item.${id}`, system: { level: SPELL_LEVELS[name.toLowerCase()] } } as any;
      });
  });

  afterEach(() => {
    AdvancementHelper.getCompendiumSpellUuidsFromNames = originalLookup;
  });

  const featText = `<p><strong>Ability Score Increase.</strong> Increase your Intelligence or Wisdom score by 1, to a maximum of 20.</p>
    <p><strong>Example Magic.</strong> You always have the Example Veil spell prepared. You can cast it without a spell slot, and
    you must finish a Long Rest before you can cast it in this way again. You can also cast it using spell slots you have of the
    appropriate level. Your spellcasting ability for the spell is the ability increased by this feat.</p>`;

  it("puts a feat's grant at level 0 with no slot required and the feat's abilities", async () => {
    const [grant] = await grantsFor("Example Feat", "feat", featText);
    expect(grant.type).toBe("ItemGrant");
    expect(grant.level).toBe(0);
    expect(grant.configuration.items).toEqual([{ uuid: "Compendium.test.spells.Item.exampleveil", optional: false }]);
    expect(grant.configuration.spell.ability).toEqual(["int", "wis"]);
    expect(grant.configuration.spell.uses.requireSlot).toBe(false);
  });

  it("keeps a later character level the feat's text names", async () => {
    const text = `<p>You learn the Example Bolt spell. You can cast it once without a spell slot, and you regain the ability to
      cast it in this way when you finish a Long Rest.</p>
      <p>When you reach character level 3, you also learn the Example Ward spell. You can cast it once without a spell slot,
      and you regain the ability to cast it in this way when you finish a Long Rest.</p>`;
    const grants = await grantsFor("Example Mark", "feat", text);
    const levels = Object.fromEntries(grants.map((g) => [g.configuration.items[0].uuid.split(".").pop(), g.level]));
    expect(levels).toEqual({ examplebolt: 0, exampleward: 3 });
  });

  it("never asks a granted cantrip for a slot", async () => {
    const text = "<p>You know the Example Whisper cantrip. You learn the Example Bolt spell and can cast it with your spell slots.</p>";
    const grants = await grantsFor("Example Feat", "feat", text);
    const cantrip = grants.find((g) => g.configuration.items[0].uuid.endsWith("examplewhisper"));
    const spell = grants.find((g) => g.configuration.items[0].uuid.endsWith("examplebolt"));
    expect(cantrip).toMatchObject({ level: 0, configuration: { spell: { uses: { requireSlot: false } } } });
    // the text gives no free cast, so the spell is cast with a slot
    expect(spell).toMatchObject({ level: 0, configuration: { spell: { uses: { requireSlot: true } } } });
  });

  it("leaves a species trait's grant at level 1", async () => {
    const text = `<p>You learn the Example Bolt spell. You can cast it once without a spell slot, and you regain the ability to
      cast it in this way when you finish a Long Rest.</p>`;
    const [grant] = await grantsFor("Example Trait", "race", text);
    expect(grant.level).toBe(1);
    expect(grant.configuration.spell.uses).toMatchObject({ max: "1", per: "lr", requireSlot: false });
  });
});
