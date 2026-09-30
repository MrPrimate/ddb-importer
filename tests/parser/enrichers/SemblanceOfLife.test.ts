/**
 * Pins for the Vestige Patron Semblance of Life forms: three summon activities whose cleanup()
 * links the spirits from the 2024 compendium Summon Celestial/Fiend/Undead spells, importing any
 * missing spell, and rewrites the spell's level scaling onto half the warlock level.
 */
const loggerMock = vi.hoisted(() => ({
  warn: vi.fn(),
  debug: vi.fn(),
  info: vi.fn(),
  error: vi.fn(),
  verbose: vi.fn(),
}));

const compendiumMock = vi.hoisted(() => ({
  getCompendiumType: vi.fn(),
  retrieveMatchingCompendiumItems: vi.fn(),
}));

vi.mock("../../../src/lib/_module", async () => ({
  logger: loggerMock,
  utils: (await vi.importActual<any>("../../../src/lib/Utils")).default,
  CompendiumHelper: compendiumMock,
}));
vi.mock("../../../src/parser/spells/CharacterSpellFactory", () => ({ default: class {} }));
vi.mock("../../../src/parser/spells/DDBSpell", () => ({ default: class {} }));
vi.mock("../../../src/parser/lib/_module", () => ({
  DDBDataUtils: {
    findSubClassByFeatureId: vi.fn(),
    classIdentifierName: (name: string) => name,
    getLimitedUses: vi.fn(),
  },
  DDBTemplateStrings: {
    parse: vi.fn((_ddb: any, _raw: any, text: string) => ({ text })),
  },
}));
vi.mock("../../../src/parser/enrichers/effects/_module", async () => ({
  AutoEffects: { effectModules: () => ({ ac5eInstalled: false }) },
  EnchantmentEffects: {},
  ChangeHelper: (await vi.importActual<any>("../../../src/parser/enrichers/effects/ChangeHelper")).default,
  EffectGenerator: {},
}));

import SemblanceOfLife from "../../../src/parser/enrichers/class/warlock/SemblanceOfLife";
import { makeEnricherData } from "../../_fixtures/ddb/factories";

const SPELL_PACK = { metadata: { id: "world.ddb-spells" } };
const LEVEL = "(min(floor(@classes.warlock.levels / 2), 9))";

function formActivities(extra: Record<string, any> = {}): Record<string, any> {
  const acts: Record<string, any> = {};
  for (const form of SemblanceOfLife.FORMS) {
    acts[form.id] = { _id: form.id, name: form.name, type: "summon", profiles: [], bonuses: { ...form.bonuses } };
  }
  return { ...acts, ...extra };
}

const SOURCEBOOK = "<a class=\"sourcebook\" href=\"https://www.dndbeyond.com/sources/dnd/phb-2024\">Player’s Handbook</a>";
const DESCRIPTION = `<p>Celestial Spirit (see the Summon Celestial spell in the ${SOURCEBOOK}), Fiendish Spirit (see the Summon Fiend spell in the ${SOURCEBOOK}), or Undead Spirit (see the Summon Undead spell in the ${SOURCEBOOK}).</p>`;

function enricherWith(acts: Record<string, any>, effects: any[] = []): SemblanceOfLife {
  return makeEnricherData(SemblanceOfLife, {
    name: "Semblance of Life",
    actions: null,
    data: { system: { activities: acts, description: { value: DESCRIPTION, chat: "" } }, effects },
  });
}

function profile(name: string, uuid: string | undefined): any {
  return { _id: foundry.utils.randomID(), name, uuid, count: null };
}

function spellDoc(name: string, profiles: any[], bonuses: Record<string, string> = {}): any {
  return {
    name,
    // plain document data, as the compendium lookup can return: an id but no uuid
    _id: name.replace(/\W/g, ""),
    type: "spell",
    system: {
      activities: {
        utilAAAAAAAAAAAA: { _id: "utilAAAAAAAAAAAA", type: "utility" },
        summonAAAAAAAAAA: { _id: "summonAAAAAAAAAA", type: "summon", profiles, bonuses },
      },
    },
  };
}

const CELESTIAL = spellDoc("Summon Celestial", [
  profile("Celestial Spirit (Avenger)", "Compendium.world.ddb-summons.Actor.avenger000000"),
  profile("Celestial Spirit (Defender)", "Compendium.world.ddb-summons.Actor.defender00000"),
], { ac: "@item.level", hp: "10 * (@item.level - 5)", attackDamage: "@item.level" });
const FIEND = spellDoc("Summon Fiend", [
  profile("Fiendish Spirit (Demon)", "Compendium.world.ddb-summons.Actor.demon00000000"),
  profile("Fiendish Spirit (Devil)", "Compendium.world.ddb-summons.Actor.devil00000000"),
  profile("Fiendish Spirit (Yugoloth)", "Compendium.world.ddb-summons.Actor.yugoloth00000"),
]);
const UNDEAD = spellDoc("Summon Undead", [
  profile("Undead Spirit (Ghostly)", "Compendium.world.ddb-summons.Actor.ghostly000000"),
  profile("Undead Spirit (Putrid)", undefined),
  profile("Undead Spirit (Skeletal)", "Compendium.world.ddb-summons.Actor.skeletal00000"),
]);

const parseSpells = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal("DDBImporter", { parse: { spells: parseSpells } });
  (globalThis as any).game ??= {};
  (globalThis as any).game.user = { isGM: true };
});

afterAll(() => {
  vi.unstubAllGlobals();
});

describe("Semblance of Life activity hints", () => {
  it("is three once-per-long-rest summons, one per spirit, with no choice build", () => {
    const enricher = enricherWith(formActivities());
    expect(enricher.type).toBe("none");
    expect(enricher.useDefaultAdditionalActivities).toBe(false);
    expect(enricher.noChoiceBuild).toBe(true);
    const hints = enricher.additionalActivities;
    expect(hints.map((h) => [h.id, h.init?.name, h.init?.type])).toEqual([
      ["semblanceCelest1", "Celestial Spirit", "summon"],
      ["semblanceFiend01", "Fiendish Spirit", "summon"],
      ["semblanceUndead1", "Undead Spirit", "summon"],
    ]);
    for (const hint of hints) {
      expect(hint.overrides).toMatchObject({ addItemConsume: true, data: { match: { attacks: true, proficiency: true } } });
      expect(hint.build?.durationOverride).toMatchObject({ value: "1", units: "hour" });
    }
    expect(enricher.override).toMatchObject({
      retainUseSpent: true,
      uses: { max: "1", recovery: [{ period: "lr", type: "recoverAll" }] },
    });
  });
});

describe("Semblance of Life cleanup", () => {
  it("keeps only the three forms and drops the option's effects without a spell compendium", async () => {
    compendiumMock.getCompendiumType.mockReturnValue(undefined);
    const acts = formActivities({
      utilTempHp000000: { _id: "utilTempHp000000", name: "Celestial Defender Vestige: Temp HP", type: "utility" },
      dmgRadiantMace00: { _id: "dmgRadiantMace00", name: "Radiant Mace", type: "damage" },
    });
    const enricher = enricherWith(acts, [{ name: "Status: Frightened" }]);

    await enricher.cleanup();

    expect(Object.keys(acts).sort()).toEqual(["semblanceCelest1", "semblanceFiend01", "semblanceUndead1"]);
    expect(enricher.data.effects).toEqual([]);
    expect(compendiumMock.retrieveMatchingCompendiumItems).not.toHaveBeenCalled();
    expect(parseSpells).not.toHaveBeenCalled();
  });

  it("links each form's spirits from its 2024 spell and rewrites the spell level", async () => {
    compendiumMock.getCompendiumType.mockReturnValue(SPELL_PACK);
    compendiumMock.retrieveMatchingCompendiumItems.mockResolvedValueOnce([CELESTIAL, FIEND, UNDEAD]);
    const acts = formActivities();

    await enricherWith(acts).cleanup();

    expect(compendiumMock.retrieveMatchingCompendiumItems).toHaveBeenCalledWith(
      ["Summon Celestial", "Summon Fiend", "Summon Undead"],
      "world.ddb-spells",
      { "system.source.rules": "2024" },
    );
    expect(parseSpells).not.toHaveBeenCalled();
    expect(acts.semblanceCelest1.profiles.map((p: any) => p.uuid)).toEqual([
      "Compendium.world.ddb-summons.Actor.avenger000000",
      "Compendium.world.ddb-summons.Actor.defender00000",
    ]);
    // a profile without an actor is skipped
    expect(acts.semblanceUndead1.profiles).toHaveLength(2);
    expect(acts.semblanceFiend01.profiles).toHaveLength(3);
    // fresh ids, never the spell's profile ids
    const spellIds = new Set(CELESTIAL.system.activities.summonAAAAAAAAAA.profiles.map((p: any) => p._id));
    for (const p of acts.semblanceCelest1.profiles) expect(spellIds.has(p._id)).toBe(false);
    expect(acts.semblanceCelest1.bonuses).toMatchObject({
      ac: LEVEL,
      hp: `10 * (${LEVEL} - 5)`,
      attackDamage: LEVEL,
    });
    // a spell summon with no bonuses keeps the form's own scaling
    expect(acts.semblanceFiend01.bonuses.hp).toBe(`15 * (${LEVEL} - 6)`);
    expect(loggerMock.warn).not.toHaveBeenCalled();
  });

  // this branch's compendium lookup returns live documents, whose activities are a Collection
  it("reads the spirits from live compendium documents", async () => {
    const live = (doc: any) => ({
      name: doc.name,
      uuid: `Compendium.world.ddb-spells.Item.${doc._id}`,
      system: { activities: new Map(Object.entries(doc.system.activities)) },
      toObject: () => foundry.utils.deepClone(doc),
    });
    compendiumMock.getCompendiumType.mockReturnValue(SPELL_PACK);
    compendiumMock.retrieveMatchingCompendiumItems.mockResolvedValueOnce([live(CELESTIAL), live(FIEND), live(UNDEAD)]);
    const acts = formActivities();

    await enricherWith(acts).cleanup();

    expect(acts.semblanceCelest1.profiles).toHaveLength(2);
    expect(acts.semblanceFiend01.profiles).toHaveLength(3);
    expect(acts.semblanceUndead1.profiles).toHaveLength(2);
    expect(loggerMock.warn).not.toHaveBeenCalled();
  });

  it("drops the sourcebook links and links the compendium spells in the description", async () => {
    compendiumMock.getCompendiumType.mockReturnValue(SPELL_PACK);
    compendiumMock.retrieveMatchingCompendiumItems.mockResolvedValueOnce([CELESTIAL, FIEND, UNDEAD]);
    const enricher = enricherWith(formActivities());

    await enricher.cleanup();

    const value = enricher.data.system.description.value;
    expect(value).not.toContain("Handbook");
    expect(value).toContain("see the @UUID[Compendium.world.ddb-spells.Item.SummonCelestial]{Summon Celestial} spell)");
    expect(value).toContain("@UUID[Compendium.world.ddb-spells.Item.SummonFiend]{Summon Fiend} spell");
    expect(value).toContain("@UUID[Compendium.world.ddb-spells.Item.SummonUndead]{Summon Undead} spell");
  });

  it("drops the sourcebook links without a spell compendium", async () => {
    compendiumMock.getCompendiumType.mockReturnValue(undefined);
    const enricher = enricherWith(formActivities());

    await enricher.cleanup();

    const value = enricher.data.system.description.value;
    expect(value).not.toContain("Handbook");
    expect(value).toContain("see the Summon Celestial spell)");
  });

  it("imports the spells the compendium lacks, then links them", async () => {
    compendiumMock.getCompendiumType.mockReturnValue(SPELL_PACK);
    compendiumMock.retrieveMatchingCompendiumItems
      .mockResolvedValueOnce([CELESTIAL])
      .mockResolvedValueOnce([CELESTIAL, FIEND, UNDEAD]);
    const acts = formActivities();

    await enricherWith(acts).cleanup();

    expect(parseSpells).toHaveBeenCalledWith({ ids: [2619117, 2619119], searchFilter: "Summon" });
    expect(acts.semblanceFiend01.profiles).toHaveLength(3);
    expect(loggerMock.warn).not.toHaveBeenCalled();
  });

  it("warns about a form whose spell is still missing after the import", async () => {
    compendiumMock.getCompendiumType.mockReturnValue(SPELL_PACK);
    compendiumMock.retrieveMatchingCompendiumItems
      .mockResolvedValueOnce([CELESTIAL, UNDEAD])
      .mockResolvedValueOnce([CELESTIAL, UNDEAD, spellDoc("Summon Fiend", [])]);
    const acts = formActivities();

    await enricherWith(acts).cleanup();

    expect(acts.semblanceFiend01.profiles).toEqual([]);
    expect(loggerMock.warn).toHaveBeenCalledTimes(1);
    expect(loggerMock.warn.mock.calls[0][0]).toContain("Summon Fiend");
  });

  it("does not import spells for a player", async () => {
    (globalThis as any).game.user = { isGM: false };
    compendiumMock.getCompendiumType.mockReturnValue(SPELL_PACK);
    compendiumMock.retrieveMatchingCompendiumItems.mockResolvedValueOnce([CELESTIAL]);

    await enricherWith(formActivities()).cleanup();

    expect(parseSpells).not.toHaveBeenCalled();
  });
});
