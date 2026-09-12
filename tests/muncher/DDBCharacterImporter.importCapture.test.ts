import { describe, expect, it } from "vitest";
import DDBCharacterImporter from "../../src/muncher/DDBCharacterImporter";

const SETTINGS = {
  updatePolicyName: true,
  updatePolicyHP: true,
  updatePolicyHitDie: true,
  updatePolicyCurrency: false,
  updatePolicyBio: true,
  updatePolicyXP: true,
  updatePolicySpellUse: false,
  updatePolicyLanguages: true,
  updatePolicyImage: false,
  activeEffectCopy: false,
  addCharacterEffects: true,
  ignoreNonDDBItems: false,
  useExistingCompendiumItems: false,
  useOverrideCompendiumItems: false,
  useChrisPremades: false,
  midiConfig: { self: null as unknown },
};
SETTINGS.midiConfig.self = SETTINGS.midiConfig;

function makeSource(): IDDBCharacterResponse {
  return {
    success: true,
    ddb: { character: { id: 133109056, name: "2024 Sorcer (Wild Magic)" } },
  } as unknown as IDDBCharacterResponse;
}

function makeActor() {
  const data = { _id: "actorIdIIIIIIIII", name: "Wild Sorcerer", items: [{ name: "Sorcery Points" }] };
  return { name: data.name, toObject: () => foundry.utils.deepClone(data) } as unknown as TImporterActor;
}

const ENV = {
  versions: { game: "14.367", system: "6.0.1", ddbimporter: "999.0.0" },
  modules: ["ddb-importer", "dae", "midi-qol"],
};

describe("DDBCharacterImporter.buildImportCapture", () => {

  it("pairs the proxy response with the finished actor and the import environment", () => {
    const capture = DDBCharacterImporter.buildImportCapture({
      source: makeSource(), actor: makeActor(), settings: SETTINGS, importError: null, ...ENV,
    });

    expect(capture.format).toBe(1);
    expect(capture.characterId).toBe(133109056);
    expect(capture.source?.ddb.character.name).toBe("2024 Sorcer (Wild Magic)");
    expect(capture.actor.items).toEqual([{ name: "Sorcery Points" }]);
    expect(capture.versions).toEqual(ENV.versions);
    expect(capture.modules).toEqual(ENV.modules);
    expect(capture.importError).toBeNull();
    expect(new Date(capture.capturedAt).toISOString()).toBe(capture.capturedAt);
  });

  it("records the import policies without the midi config so the file always serialises", () => {
    const capture = DDBCharacterImporter.buildImportCapture({
      source: makeSource(), actor: makeActor(), settings: SETTINGS, importError: "ImportFailure", ...ENV,
    });

    expect(capture.importSettings).not.toHaveProperty("midiConfig");
    expect(capture.importSettings.updatePolicyCurrency).toBe(false);
    expect(capture.importError).toBe("ImportFailure");
    expect(() => JSON.stringify(capture)).not.toThrow();
  });

  it("copes with a missing response", () => {
    const capture = DDBCharacterImporter.buildImportCapture({
      source: null, actor: makeActor(), settings: SETTINGS, importError: null, ...ENV,
    });

    expect(capture.characterId).toBeNull();
    expect(capture.source).toBeNull();
    expect(capture.actor.name).toBe("Wild Sorcerer");
  });
});
