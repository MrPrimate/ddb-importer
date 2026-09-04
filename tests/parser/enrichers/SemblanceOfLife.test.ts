/**
 * Pins for the Vestige Patron Semblance of Life transform: the activity hint shape and the
 * cleanup() that links the spirit forms from the compendium Summon Celestial/Fiend/Undead spells.
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

function transformActivity(): any {
  return { _id: "tranSemblance000", name: "Shapeshift Vestige Companion", type: "transform", transform: { mode: "" }, profiles: [] };
}

function activities(extra: Record<string, any> = {}): Record<string, any> {
  const transform = transformActivity();
  return { [transform._id]: transform, ...extra };
}

function enricherWith(acts: Record<string, any>, options: Record<string, any> = {}): SemblanceOfLife {
  return makeEnricherData(SemblanceOfLife, {
    name: "Semblance of Life",
    actions: null,
    data: { system: { activities: acts } },
    ...options,
  });
}

function spellDoc(name: string, profiles: any[]): any {
  return {
    name,
    type: "spell",
    system: {
      activities: {
        utilAAAAAAAAAAAA: { _id: "utilAAAAAAAAAAAA", type: "utility" },
        summonAAAAAAAAAA: { _id: "summonAAAAAAAAAA", type: "summon", profiles },
      },
    },
  };
}

function profile(name: string, uuid: string | undefined): any {
  return { _id: foundry.utils.randomID(), name, uuid, count: null };
}

const CELESTIAL = spellDoc("Summon Celestial", [
  profile("Celestial Spirit (Avenger)", "Compendium.world.ddb-summons.Actor.avenger000000"),
  profile("Celestial Spirit (Defender)", "Compendium.world.ddb-summons.Actor.defender00000"),
]);
const FIEND = spellDoc("Summon Fiend", [
  profile("Fiendish Spirit (Demon)", "Compendium.world.ddb-summons.Actor.demon00000000"),
  profile("Fiendish Spirit (Devil)", "Compendium.world.ddb-summons.Actor.devil00000000"),
  profile("Fiendish Spirit (Yugoloth)", "Compendium.world.ddb-summons.Actor.yugoloth00000"),
]);
const UNDEAD = spellDoc("Summon Undead", [
  profile("Undead Spirit (Ghostly)", "Compendium.world.ddb-summons.Actor.ghostly000000"),
  profile("Undead Spirit (Putrid)", "Compendium.world.ddb-summons.Actor.putrid0000000"),
  profile("Undead Spirit (Skeletal)", "Compendium.world.ddb-summons.Actor.skeletal00000"),
]);

beforeEach(() => {
  vi.clearAllMocks();
});

describe("Semblance of Life activity hint", () => {
  it("is a direct-mode transform of one targeted creature within 90 feet for an hour", () => {
    const enricher = enricherWith(activities());
    expect(enricher.type).toBe("transform");
    expect(enricher.mergeChoiceActivities).toBe(true);
    expect(enricher.addToDefaultAdditionalActivities).toBe(true);
    expect(enricher.activity).toMatchObject({
      name: "Shapeshift Vestige Companion",
      activationType: "action",
      targetType: "creature",
      targetCount: 1,
      rangeType: "ft",
      rangeValue: 90,
      addItemConsume: true,
      data: {
        duration: { value: "1", units: "hour" },
        transform: { customize: true, mode: "", preset: "polymorph" },
        settings: {
          keep: ["hp", "feats", "bio"],
          tempFormula: "@source.attributes.hp.max",
          preset: "polymorph",
        },
        profiles: [],
      },
    });
    expect(enricher.override).toMatchObject({
      retainUseSpent: true,
      uses: { max: "1", recovery: [{ period: "lr", type: "recoverAll" }] },
    });
  });
});

describe("Semblance of Life cleanup", () => {
  it("drops DDB's duplicate Shapeshift utility and leaves the profiles empty without a spell compendium", async () => {
    compendiumMock.getCompendiumType.mockReturnValue(undefined);
    const acts = activities({
      utilShapeshift00: { _id: "utilShapeshift00", name: "Shapeshift Vestige Companion", type: "utility" },
      utilTempHp000000: { _id: "utilTempHp000000", name: "Celestial Defender Vestige: Temp HP", type: "utility" },
      dmgRadiantMace00: { _id: "dmgRadiantMace00", name: "Radiant Mace", type: "damage" },
    });
    const enricher = enricherWith(acts);

    await enricher.cleanup();

    expect(Object.keys(acts).sort()).toEqual(["dmgRadiantMace00", "tranSemblance000", "utilTempHp000000"]);
    expect(acts.tranSemblance000.profiles).toEqual([]);
    expect(compendiumMock.retrieveMatchingCompendiumItems).not.toHaveBeenCalled();
    expect(loggerMock.warn).not.toHaveBeenCalled();
  });

  it("does nothing when the document has no transform activity", async () => {
    compendiumMock.getCompendiumType.mockReturnValue(SPELL_PACK);
    const acts = { utilOnly00000000: { _id: "utilOnly00000000", name: "Something", type: "utility" } };
    const enricher = enricherWith(acts);

    await enricher.cleanup();

    expect(compendiumMock.retrieveMatchingCompendiumItems).not.toHaveBeenCalled();
    expect(Object.keys(acts)).toEqual(["utilOnly00000000"]);
  });

  it("links the eight spirit forms from the 2024 compendium spells", async () => {
    compendiumMock.getCompendiumType.mockReturnValue(SPELL_PACK);
    compendiumMock.retrieveMatchingCompendiumItems.mockResolvedValueOnce([CELESTIAL, FIEND, UNDEAD]);
    const acts = activities();
    const enricher = enricherWith(acts);

    await enricher.cleanup();

    expect(compendiumMock.retrieveMatchingCompendiumItems).toHaveBeenCalledTimes(1);
    expect(compendiumMock.retrieveMatchingCompendiumItems).toHaveBeenCalledWith(
      ["Summon Celestial", "Summon Fiend", "Summon Undead"],
      "world.ddb-spells",
      { "system.source.rules": "2024" },
    );
    const profiles = acts.tranSemblance000.profiles;
    expect(profiles.map((p: any) => p.name)).toEqual([
      "Celestial Spirit (Avenger)",
      "Celestial Spirit (Defender)",
      "Fiendish Spirit (Demon)",
      "Fiendish Spirit (Devil)",
      "Fiendish Spirit (Yugoloth)",
      "Undead Spirit (Ghostly)",
      "Undead Spirit (Putrid)",
      "Undead Spirit (Skeletal)",
    ]);
    expect(profiles[0]).toEqual({
      _id: expect.stringMatching(/^[A-Za-z0-9]{16}$/),
      name: "Celestial Spirit (Avenger)",
      uuid: "Compendium.world.ddb-summons.Actor.avenger000000",
      cr: "",
      level: { min: null, max: null },
      sizes: [],
      types: [],
      movement: [],
    });
    // fresh ids, never the summon profile ids
    const summonIds = new Set(CELESTIAL.system.activities.summonAAAAAAAAAA.profiles.map((p: any) => p._id));
    for (const p of profiles) expect(summonIds.has(p._id)).toBe(false);
    expect(new Set(profiles.map((p: any) => p._id)).size).toBe(8);
    expect(loggerMock.warn).not.toHaveBeenCalled();
  });

  it("skips summon profiles without an actor uuid", async () => {
    compendiumMock.getCompendiumType.mockReturnValue(SPELL_PACK);
    const partial = spellDoc("Summon Celestial", [
      profile("Celestial Spirit (Avenger)", "Compendium.world.ddb-summons.Actor.avenger000000"),
      profile("Celestial Spirit (Defender)", undefined),
    ]);
    compendiumMock.retrieveMatchingCompendiumItems.mockResolvedValueOnce([partial, FIEND, UNDEAD]);
    const acts = activities();

    await enricherWith(acts).cleanup();

    expect(acts.tranSemblance000.profiles.map((p: any) => p.name)).not.toContain("Celestial Spirit (Defender)");
    expect(acts.tranSemblance000.profiles).toHaveLength(7);
  });

  it("falls back to the 2014 spells for names the 2024 query misses and warns about the rest", async () => {
    compendiumMock.getCompendiumType.mockReturnValue(SPELL_PACK);
    compendiumMock.retrieveMatchingCompendiumItems
      .mockResolvedValueOnce([CELESTIAL, spellDoc("Summon Fiend", [])])
      .mockResolvedValueOnce([UNDEAD]);
    const acts = activities();

    await enricherWith(acts).cleanup();

    expect(compendiumMock.retrieveMatchingCompendiumItems).toHaveBeenCalledTimes(2);
    expect(compendiumMock.retrieveMatchingCompendiumItems).toHaveBeenLastCalledWith(
      ["Summon Fiend", "Summon Undead"],
      "world.ddb-spells",
      { "system.source.rules": "2014" },
    );
    expect(acts.tranSemblance000.profiles).toHaveLength(5);
    expect(loggerMock.warn).toHaveBeenCalledTimes(1);
    expect(loggerMock.warn.mock.calls[0][0]).toContain("Summon Fiend");
    expect(loggerMock.warn.mock.calls[0][0]).not.toContain("Summon Undead");
  });

  it("queries the 2014 spells first for a 2014 feature", async () => {
    compendiumMock.getCompendiumType.mockReturnValue(SPELL_PACK);
    compendiumMock.retrieveMatchingCompendiumItems.mockResolvedValueOnce([CELESTIAL, FIEND, UNDEAD]);
    const acts = activities();

    await enricherWith(acts, { is2014: true }).cleanup();

    expect(compendiumMock.retrieveMatchingCompendiumItems).toHaveBeenCalledWith(
      expect.anything(),
      "world.ddb-spells",
      { "system.source.rules": "2014" },
    );
  });
});
