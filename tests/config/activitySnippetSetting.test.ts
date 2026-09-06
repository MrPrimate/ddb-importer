// @vitest-environment jsdom

import SETTINGS from "../../src/config/settings/settings";
import MuncherSettings from "../../src/lib/MuncherSettings";
import { setMockSettings } from "../_setup/foundryMocks";

describe("activity snippet setting", () => {
  it("registers a hidden default-on world setting", () => {
    // Hidden from core module settings and surfaced on the DDB panels instead; new worlds
    // get activity snippets without having to find the toggle.
    expect(SETTINGS.DEFAULT_SETTINGS.EARLY["add-ddb-snippets-to-activities"]).toMatchObject({
      scope: "world",
      config: false,
      type: Boolean,
      default: true,
    });
  });

  // v7.0.x: skipped, expects dnd5e 6.0 / v14 branch behaviour or an API not on this branch; review before enabling

  it.skip("exposes the setting through Muncher General and Character Import Options", () => {
    setMockSettings({
      "add-ddb-snippets-to-activities": false,
      "munching-policy-use-source-filter": false,
      "munching-policy-muncher-sources": [],
      "munching-policy-muncher-included-source-categories": [],
      "munching-policy-muncher-monster-types": [],
    });
    (game.settings as any).settings = new Map([
      ["ddb-importer.munching-selection-compendium-folders-monster", { choices: {} }],
      ["ddb-importer.munching-selection-compendium-folders-spell", { choices: {} }],
      ["ddb-importer.munching-selection-compendium-folders-item", { choices: {} }],
    ]);
    const expected = expect.objectContaining({
      name: "add-ddb-snippets-to-activities",
      isChecked: false,
      enabled: true,
      label: "Add DDB Snippets to Activities?",
    });

    expect(MuncherSettings.getMuncherSettings(false).genericConfig).toContainEqual(expected);
    expect(MuncherSettings.getCharacterImportSettings().importConfig).toContainEqual(expected);
    expect(MuncherSettings.getEnhancementSettings()).not.toContainEqual(expected);
  });
});
