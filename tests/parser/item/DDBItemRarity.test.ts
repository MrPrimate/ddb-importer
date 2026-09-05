// @vitest-environment jsdom
/**
 * Rarity generation on real DDB item payloads from the private audit fixture submodule
 * (tests/audit/fixtures/items). dnd5e 6.0 stores rarity as a set with no "varies" member,
 * so DDB's "Varies" and "Unknown Rarity" labels must become an empty set with the label kept
 * on the dndbeyond flags. Skips when the submodule is not populated.
 */
import fs from "node:fs";
import path from "node:path";

const FIXTURE_DIR = path.resolve(__dirname, "../../audit/fixtures/items");

function fixturesPresent(): boolean {
  try {
    return fs.readdirSync(FIXTURE_DIR).some((f) => f.startsWith("RAW-") && f.endsWith(".json"));
  } catch {
    return false;
  }
}

const WANTED = [
  "Amulet of the Planes",
  "Figurine of Wondrous Power",
  "Arrows",
  "Spell Scroll (0 - Cantrip)",
  "Dragongleam",
  "Potion of Healing (Normal)",
  "Horn of Valhalla",
  "Rejuvenating Draft",
];

/** Concrete variants that sit beside the Varies roots in a real munch batch. */
const SIBLING_PREFIXES = ["Horn of Valhalla (", "Figurine of Wondrous Power ("];

/** Pull the first fixture definition for each wanted item name (and the siblings), reading every file. */
function findDefinitions(): Map<string, any> {
  const found = new Map<string, any>();
  const files = fs.readdirSync(FIXTURE_DIR).filter((f) => f.startsWith("RAW-") && f.endsWith(".json")).sort();
  for (const file of files) {
    const payload = JSON.parse(fs.readFileSync(path.join(FIXTURE_DIR, file), "utf-8"));
    for (const item of payload.data?.items ?? []) {
      const wanted = WANTED.includes(item.name) || SIBLING_PREFIXES.some((prefix) => item.name.startsWith(prefix));
      if (wanted && !found.has(item.name)) found.set(item.name, item);
    }
  }
  return found;
}

describe.skipIf(!fixturesPresent())("DDBItem rarity on real payloads", () => {
  const docs = new Map<string, any>();

  beforeAll(async () => {
    const harness = await import("../../audit/_classAuditHarness");
    harness.installDDBImporterGlobalStub();
    harness.installCompendiumStub();
    await harness.setupClassAuditEnvironment();
    const { default: DDBCharacter } = await import("../../../src/parser/DDBCharacter");
    const { SystemHelpers } = await import("../../../src/parser/lib/_module");

    const definitions = findDefinitions();
    const inventory = [...definitions.values()].map((definition) => ({
      chargesUsed: 0,
      definitionId: 0,
      definitionTypeId: 0,
      displayAsAttack: null,
      entityTypeId: 0,
      equipped: false,
      id: 0,
      isAttuned: false,
      quantity: 1,
      definition,
      limitedUse: null,
    }));
    const ddbCharacter = new DDBCharacter();
    ddbCharacter.raw.character = {
      system: SystemHelpers.getTemplate("character"),
      type: "character",
      name: "",
      flags: {
        ddbimporter: {
          compendium: true,
          dndbeyond: {
            effectAbilities: {},
            totalLevels: 0,
            proficiencies: [],
            proficienciesIncludingEffects: [],
            characterValues: [],
          },
        },
      },
    } as any;
    ddbCharacter.source = {
      success: true,
      ddb: {
        character: {
          classes: [],
          race: { racialTraits: [] },
          characterValues: [],
          inventory,
          customItems: null,
          options: { class: [], race: [], feat: [] },
          spells: { item: [] },
          modifiers: { race: [], class: [], background: [], feat: [], item: [], condition: [] },
          feats: [],
        },
      },
    } as any;
    ddbCharacter.raw.itemSpells = [];
    for (const doc of await ddbCharacter.getInventory()) {
      docs.set(doc.flags?.ddbimporter?.originalName ?? doc.name, doc);
    }
  }, 120_000);

  const rarityOf = (name: string) => {
    const doc = docs.get(name);
    expect(doc, `fixture item ${name}`).toBeDefined();
    return { rarities: doc.system.rarities, flag: doc.flags.ddbimporter.dndbeyond.rarity, system: doc.system };
  };

  it("writes a single dnd5e key for a labelled magic item", () => {
    const { rarities, flag, system } = rarityOf("Amulet of the Planes");
    expect(rarities).toEqual(["veryRare"]);
    expect(flag).toBe("Very Rare");
    expect("rarity" in system).toBe(false);
  });

  it("keeps Common on magical items and drops it from mundane gear", () => {
    expect(rarityOf("Spell Scroll (0 - Cantrip)").rarities).toEqual(["common"]);
    expect(rarityOf("Arrows").rarities).toEqual([]);
    expect(rarityOf("Arrows").flag).toBe("Common");
  });

  it("gives an Unknown Rarity item an empty set with the label on the flag", () => {
    expect(rarityOf("Dragongleam").rarities).toEqual([]);
    expect(rarityOf("Dragongleam").flag).toBe("Unknown Rarity");
  });

  it("fills a Varies root from its description tiers and its batch siblings", () => {
    // prose "(rare)" style plus the (Silver Raven) uncommon and (Obsidian Steed) very rare figurines
    expect(rarityOf("Figurine of Wondrous Power").rarities).toEqual(["uncommon", "rare", "veryRare"]);
    expect(rarityOf("Figurine of Wondrous Power").flag).toBe("Varies");
    // table with a Rarity column
    expect(rarityOf("Potion of Healing (Normal)").rarities).toEqual(["common", "uncommon", "rare", "veryRare"]);
    // parenthesised tiers in prose
    expect(rarityOf("Rejuvenating Draft").rarities).toEqual(["uncommon", "rare", "veryRare", "legendary"]);
    // no text signal at all: the (Silver)/(Brass)/(Bronze)/(Iron) siblings supply the set
    expect(rarityOf("Horn of Valhalla").rarities).toEqual(["rare", "veryRare", "legendary"]);
  });
});
