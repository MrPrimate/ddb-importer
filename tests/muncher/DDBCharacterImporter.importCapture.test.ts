import { describe, expect, it } from "vitest";
import DDBCharacterImporter from "../../src/muncher/DDBCharacterImporter";
import { setMockSettings } from "../_setup/foundryMocks";

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

    expect(capture.format).toBe(2);
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

  it("carries the derived sheet totals when supplied and omits them otherwise", () => {
    const derived = DDBCharacterImporter.deriveSheetValues({
      system: {
        attributes: { ac: { value: 17 }, hp: { max: 52 }, prof: 3, init: { total: 4 }, movement: { walk: 30, fly: null }, senses: { darkvision: 60 } },
        abilities: { str: { value: 16, mod: 3, save: { value: 6 } }, dex: { value: 14, mod: 2, save: 2 } },
        skills: { acr: { total: 5 }, ath: { total: 6 } },
        spells: { spell1: { max: 4 }, pact: { max: 2 } },
      },
    } as unknown as TImporterActor);
    expect(derived).toEqual({
      ac: 17, hpMax: 52, prof: 3, init: 4,
      abilities: { str: { value: 16, mod: 3, save: 6 }, dex: { value: 14, mod: 2, save: 2 } },
      skills: { acr: 5, ath: 6 }, spells: { spell1: 4, pact: 2 },
      movement: { walk: 30, fly: null }, senses: { darkvision: 60 },
    });

    const withDerived = DDBCharacterImporter.buildImportCapture({
      source: makeSource(), actor: makeActor(), settings: SETTINGS, importError: null, derived, ...ENV,
    });
    expect(withDerived.derived).toEqual(derived);
    const without = DDBCharacterImporter.buildImportCapture({
      source: makeSource(), actor: makeActor(), settings: SETTINGS, importError: null, ...ENV,
    });
    expect(without).not.toHaveProperty("derived");
  });

  it("answers null for totals an unprepared actor lacks", () => {
    const derived = DDBCharacterImporter.deriveSheetValues({ system: {} } as unknown as TImporterActor);
    expect(derived).toEqual({ ac: null, hpMax: null, prof: null, init: null, abilities: {}, skills: {}, spells: {}, movement: {}, senses: {} });
  });

  it("records the module settings with credentials redacted", () => {
    setMockSettings({ "cobalt-cookie": "secret", "beta-key": "secret", "munching-policy-update-existing": true, "log-level": "INFO" });
    const settings = DDBCharacterImporter.collectModuleSettings();
    expect(settings["cobalt-cookie"]).toBe("REDACTED");
    expect(settings["beta-key"]).toBe("REDACTED");
    for (const key of Object.keys(settings).filter((k) => DDBCharacterImporter.SECRET_SETTING_PATTERN.test(k))) {
      expect(settings[key], key).toBe("REDACTED");
    }
    expect(settings["munching-policy-update-existing"]).toBe(true);
    expect(settings["log-level"]).toBe("INFO");
    expect(JSON.stringify(settings)).not.toContain("secret");

    const capture = DDBCharacterImporter.buildImportCapture({
      source: makeSource(), actor: makeActor(), settings: SETTINGS, importError: null, moduleSettings: settings, ...ENV,
    });
    expect(capture.settings?.["munching-policy-update-existing"]).toBe(true);
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
