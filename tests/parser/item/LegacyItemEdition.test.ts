// @vitest-environment jsdom
/**
 * Edition classification of legacy items on real DDB payloads from the private audit fixture
 * submodule (tests/audit/fixtures/items). DDB lists some 2014 printings under a 2024 book as well
 * (legacy Net 1782728300:38 carries sources 148 and 1), so a legacy definition with any 2014 source must parse
 * as 2014 and stay distinct from the separate 2024 definition of the same name, which the muncher
 * and the character compendium lookup tell apart only by edition. Skips when the submodule is not
 * populated.
 */
import fs from "node:fs";
import path from "node:path";

const FIXTURE_DIR = path.resolve(__dirname, "../../audit/fixtures/items");
// Non-literal specifier on purpose: the harness lives in the private submodule, and a literal
// path makes `tsc` resolve it, which fails on CI checkouts where tests/audit is empty.
const HARNESS_MODULE = "../../audit/_classAuditHarness";

// definition ids are only unique per entity type (gear 38 is Clothes, Common), so items are
// picked by DDB's definitionKey, "<entityTypeId>:<id>"
const LEGACY_NET = "1782728300:38";
const NET_2024 = "2103445194:392";
const LEGACY_DEFENDER = "112130694:4618";
const DEFENDER_2024 = "112130694:9228429";
// not legacy, sources span both editions: must stay 2024
const MIXED_POTION = "112130694:5133";
const WANTED = [LEGACY_NET, NET_2024, LEGACY_DEFENDER, DEFENDER_2024, MIXED_POTION];

function fixturesPresent(): boolean {
  try {
    return fs.readdirSync(FIXTURE_DIR).some((f) => f.endsWith(".json"));
  } catch {
    return false;
  }
}

/** Pull the first fixture definition for each wanted definition key. */
function findDefinitions(): Map<string, any> {
  const found = new Map<string, any>();
  const files = fs.readdirSync(FIXTURE_DIR).filter((f) => f.endsWith(".json")).sort();
  for (const file of files) {
    if (found.size === WANTED.length) break;
    const payload = JSON.parse(fs.readFileSync(path.join(FIXTURE_DIR, file), "utf-8"));
    for (const item of payload.data?.items ?? []) {
      if (WANTED.includes(item.definitionKey) && !found.has(item.definitionKey)) found.set(item.definitionKey, item);
    }
  }
  return found;
}

describe.skipIf(!fixturesPresent())("legacy item edition on real payloads", () => {
  const docs = new Map<string, any>();

  beforeAll(async () => {
    const harness = await import(HARNESS_MODULE);
    harness.installDDBImporterGlobalStub();
    harness.installCompendiumStub();
    await harness.setupClassAuditEnvironment();
    const { default: DDBCharacter } = await import("../../../src/parser/DDBCharacter");
    const { SystemHelpers } = await import("../../../src/parser/lib/_module");

    const inventory = [...findDefinitions().values()].map((definition) => ({
      chargesUsed: 0,
      definitionId: 0,
      definitionTypeId: 0,
      displayAsAttack: null,
      entityTypeId: definition.entityTypeId,
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
      docs.set(`${doc.flags?.ddbimporter?.entityTypeId}:${doc.flags?.ddbimporter?.definitionId}`, doc);
    }
  }, 120_000);

  const doc = (id: string) => {
    const found = docs.get(id);
    expect(found, `fixture item ${id}`).toBeDefined();
    return found;
  };
  const activities = (id: string): any[] => Object.values(doc(id).system.activities);
  const edition = (id: string) => ({
    rules: doc(id).system.source.rules,
    is2014: doc(id).flags.ddbimporter.is2014,
    is2024: doc(id).flags.ddbimporter.is2024,
  });

  it("parses a legacy item with a 2024 source as 2014", () => {
    expect(edition(LEGACY_NET)).toEqual({ rules: "2014", is2014: true, is2024: false });
    expect(edition(LEGACY_DEFENDER)).toEqual({ rules: "2014", is2014: true, is2024: false });
  });

  it("keeps the 2024 definitions and non-legacy mixed-source items as 2024", () => {
    expect(edition(NET_2024)).toEqual({ rules: "2024", is2014: false, is2024: true });
    expect(edition(DEFENDER_2024)).toEqual({ rules: "2024", is2014: false, is2024: true });
    expect(edition(MIXED_POTION)).toEqual({ rules: "2024", is2014: false, is2024: true });
  });

  it("gives the legacy Net a weapon attack and a plain Strength escape", () => {
    const types = activities(LEGACY_NET).map((activity) => activity.type);
    expect(types).toContain("attack");
    expect(types).not.toContain("save");
    const escape = activities(LEGACY_NET).find((activity) => activity.type === "check");
    expect(escape?.check).toMatchObject({ ability: "str", associated: [], dc: { formula: "10" } });
  });

  it("gives the 2024 Net a Dexterity save and an Athletics escape", () => {
    const save = activities(NET_2024).find((activity) => activity.type === "save");
    expect(save?.save?.ability).toEqual(["dex"]);
    const escape = activities(NET_2024).find((activity) => activity.type === "check");
    expect(escape?.check).toMatchObject({ associated: ["ath"], dc: { formula: "10" } });
  });
});
