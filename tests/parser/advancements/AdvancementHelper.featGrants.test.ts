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

  it("reads a 2014 'requiring no spell slot' cast that slots can also cast", async () => {
    const text = [
      "<p>Increase your Intelligence, Wisdom, or Charisma score by 1, to a maximum of 20.</p>",
      "<p>You can cast the Example Veil spell, requiring no spell slot or components, and you must finish a long rest before you can cast it this way again.",
      "Your spellcasting ability for the spell is the ability increased by this feat. If you have spell slots of 2nd level or higher, you can cast this spell with them.</p>",
    ].join(" ");
    const feature = makeFeature("Example Mind", "feat", text);
    await AdvancementHelper.addSpellAdvancement({ ddbParser: makeParser("feat"), feature, type: "feat" });
    const [grant] = Object.values(feature.system.advancement) as any[];
    expect(grant).toMatchObject({ type: "ItemGrant", level: 0 });
    expect(grant.configuration.spell).toMatchObject({ ability: ["int", "wis", "cha"], method: "spell", uses: { requireSlot: false } });
    // a feat without a spell choice keeps its free cast on a cast activity spending the feat's own use
    const casts = Object.values(feature.system.activities).filter((activity: any) => activity.type === "cast") as any[];
    expect(casts).toHaveLength(1);
    expect(casts[0].consumption.targets).toMatchObject([{ type: "itemUses", value: 1 }]);
    expect(feature.system.uses).toMatchObject({ max: "1", recovery: [{ period: "lr", type: "recoverAll" }] });
  });

  it("gives the feat's cast DDB's chosen ability on a character import", async () => {
    const text = [
      "<p>Increase your Intelligence, Wisdom, or Charisma score by 1, to a maximum of 20.</p>",
      "<p>You always have the Example Veil spell prepared. You can cast it without a spell slot, and you must finish a Long Rest before you can cast it in this way again.",
      "Your spellcasting ability for the spell is the ability increased by this feat.</p>",
    ].join(" ");
    const feature = makeFeature("Example Mind", "feat", text);
    const parser = makeParser("feat");
    // DDB's own copy of the spell, as CharacterSpellFactory parses it for the feat
    parser.ddbCharacter._spellParser._granted.feat.push({
      name: "Example Veil",
      type: "spell",
      system: { ability: "wis", level: 2 },
      flags: { ddbimporter: { originalName: "Example Veil", dndbeyond: { lookup: "feat", lookupName: "Example Mind" } } },
      _stats: { compendiumSource: "Compendium.test.spells.Item.exampleveil" },
    });
    await AdvancementHelper.addSpellAdvancement({ ddbParser: parser, feature, type: "feat" });
    const cast = Object.values(feature.system.activities).find((activity: any) => activity.type === "cast") as any;
    expect(cast.spell).toMatchObject({ uuid: "Compendium.test.spells.Item.exampleveil", ability: "wis" });

    // a munched feat has no character to read the choice from, so its cast keeps the actor's ability
    const munched = makeFeature("Example Mind", "feat", text);
    await AdvancementHelper.addSpellAdvancement({ ddbParser: makeParser("feat"), feature: munched, type: "feat" });
    const munchedCast = Object.values(munched.system.activities).find((activity: any) => activity.type === "cast") as any;
    expect(munchedCast.spell.ability).toBeUndefined();
  });

  it("offers a counted school choice with the feat's abilities", async () => {
    const text = [
      "<p>Increase your Intelligence or Wisdom score by 1, to a maximum of 20.</p>",
      "<p>You learn two 1st-level spells of your choice. The 1st-level spells must be from the divination, conjuration, or transmutation school of magic.",
      "You can cast each of these spells once without expending a spell slot. You regain the ability to cast these two spells in this way when you finish a long rest.",
      "You can also cast these spells using spell slots you have of the appropriate level. The spells’ spellcasting ability is the ability increased by this feat.</p>",
    ].join(" ");
    const [choice] = await grantsFor("Example Coven", "feat", text);
    expect(choice.type).toBe("ItemChoice");
    expect(choice.level).toBe(0);
    expect(choice.hint).toBe("Choose 2 level 1 spells from the Divination, Conjuration, or Transmutation school.");
    expect(choice.configuration.choices).toEqual({ 0: { count: 2, replacement: false } });
    expect(choice.configuration.restriction).toMatchObject({ level: 1, school: ["div", "con", "trs"] });
    expect(choice.configuration.spell).toMatchObject({ ability: ["int", "wis"], uses: { max: "1", per: "lr", requireSlot: false } });
  });

  it("leaves a species trait's grant at level 1", async () => {
    const text = `<p>You learn the Example Bolt spell. You can cast it once without a spell slot, and you regain the ability to
      cast it in this way when you finish a Long Rest.</p>`;
    const [grant] = await grantsFor("Example Trait", "race", text);
    expect(grant.level).toBe(1);
    expect(grant.configuration.spell.uses).toMatchObject({ max: "1", per: "lr", requireSlot: false });
  });

  describe("a choice feature emitted beside its option documents", () => {
    const parentId = 4242;
    const options = [
      { id: 1, label: "Seer", description: "<p>You can cast the Example Veil spell without expending a spell slot.</p>" },
      { id: 2, label: "Warden", description: "<p>You always have the Example Ward spell prepared. You can cast it once without a spell slot.</p>" },
      { id: 3, label: "Brawler", description: "<p>You gain Resistance to Bludgeoning damage.</p>" },
    ];
    // the parent's text describes every option, plus a grant all of them share
    const parentText = [
      "<p>You learn the Example Bolt spell. You can cast it once without a spell slot, and you regain the ability to cast it in this way when you finish a Long Rest.</p>",
      "<p>Choose two of the following talents.</p>",
      ...options.map((option) => `<p><strong>${option.label}.</strong> ${option.description.replace(/<\/?p>/g, "")}</p>`),
    ].join("");

    function choiceParser(optionDocuments: any[]) {
      const parser = makeParser("class");
      parser.processed = { features: optionDocuments };
      parser.ddbData = {
        character: {
          options: { class: [] },
          choices: {
            class: [{ id: "choice-1", componentId: parentId, componentTypeId: 77, type: 3, parentChoiceId: null, optionValue: 1, optionIds: [] }],
            choiceDefinitions: [{ id: "77-3", options }],
          },
        },
      };
      return parser;
    }

    function choiceParent() {
      const feature = makeFeature("Example Talents", "class", parentText);
      feature.flags.ddbimporter = { ...feature.flags.ddbimporter, id: parentId, isChoiceFeature: true };
      return feature;
    }

    const optionDocument = { flags: { ddbimporter: { id: parentId, isChoice: true } } };

    it("leaves the spells an option's text names to that option, chosen or not", async () => {
      const feature = choiceParent();
      await AdvancementHelper.addSpellAdvancement({ ddbParser: choiceParser([optionDocument]), feature, type: "class" });
      const granted = (Object.values(feature.system.advancement) as any[]).map((g) => g.configuration.items[0].uuid.split(".").pop());
      expect(granted).toEqual(["examplebolt"]);
      const casts = (Object.values(feature.system.activities) as any[]).filter((activity) => activity.type === "cast");
      expect(casts.map((cast) => cast.spell.uuid.split(".").pop())).toEqual(["examplebolt"]);
    });

    it("reads an emitted option's own text when DDB lists the options apart from its choices", async () => {
      const feature = choiceParent();
      const parser = choiceParser([{
        flags: { ddbimporter: { id: parentId, isChoice: true, initialFeature: { value: options[0].description, chat: "" } } },
      }]);
      parser.ddbData.character.choices = { class: [], choiceDefinitions: [] };
      await AdvancementHelper.addSpellAdvancement({ ddbParser: parser, feature, type: "class" });
      const granted = (Object.values(feature.system.advancement) as any[]).map((g) => g.configuration.items[0].uuid.split(".").pop());
      expect(granted).toEqual(expect.arrayContaining(["examplebolt", "exampleward"]));
      expect(granted).not.toContain("exampleveil");
    });

    it("keeps every grant when no option document was emitted", async () => {
      const feature = choiceParent();
      await AdvancementHelper.addSpellAdvancement({ ddbParser: choiceParser([]), feature, type: "class" });
      const granted = (Object.values(feature.system.advancement) as any[]).map((g) => g.configuration.items[0].uuid.split(".").pop());
      expect(granted).toEqual(expect.arrayContaining(["examplebolt", "exampleveil", "exampleward"]));
    });
  });
});
