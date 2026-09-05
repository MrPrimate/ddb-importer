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
];

/** Pull the first fixture definition for each wanted item name, reading files until all are found. */
function findDefinitions(): Map<string, any> {
  const found = new Map<string, any>();
  const files = fs.readdirSync(FIXTURE_DIR).filter((f) => f.startsWith("RAW-") && f.endsWith(".json")).sort();
  for (const file of files) {
    const payload = JSON.parse(fs.readFileSync(path.join(FIXTURE_DIR, file), "utf-8"));
    for (const item of payload.data?.items ?? []) {
      if (WANTED.includes(item.name) && !found.has(item.name)) found.set(item.name, item);
    }
    if (found.size === WANTED.length) break;
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

  it("gives Varies and Unknown Rarity items an empty set with the label on the flag", () => {
    expect(rarityOf("Figurine of Wondrous Power").rarities).toEqual([]);
    expect(rarityOf("Figurine of Wondrous Power").flag).toBe("Varies");
    expect(rarityOf("Dragongleam").rarities).toEqual([]);
    expect(rarityOf("Dragongleam").flag).toBe("Unknown Rarity");
  });
});
