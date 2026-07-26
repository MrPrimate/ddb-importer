import { describe, it, expect } from "vitest";
import fallbackConfigJson from "../../data/fallback-config.json";
import fallbackRulesJson from "../../data/fallback-rules.json";

// Guards the runtime-loaded JSON assets in data/ against truncation or corruption.
// These files replaced the bundled fallbackConfig.ts / fallbackRules.ts sources.
const config: IDDBConfig = fallbackConfigJson;
const rules: IDDBRuleData = fallbackRulesJson;

describe("fallback-config.json", () => {
  it("contains the core config domains", () => {
    expect(config.armor.length).toBeGreaterThan(0);
    expect(config.sources.length).toBeGreaterThan(0);
    expect(config.conditions.length).toBeGreaterThan(0);
    expect(config.weapons.length).toBeGreaterThan(0);
    expect(config.stats.length).toBeGreaterThan(0);
  });

  it("has named entries with ids", () => {
    const source = config.sources[0];
    expect(source.id).toEqual(expect.any(Number));
    expect(source.name).toEqual(expect.any(String));
  });
});

describe("fallback-rules.json", () => {
  it("contains the core rule constants", () => {
    expect(rules.maxCharacterLevel).toBeGreaterThan(0);
    expect(rules.maxSpellLevel).toBeGreaterThan(0);
    expect(rules.restoreTypes.length).toBeGreaterThan(0);
    expect(rules.raceGroups.length).toBeGreaterThan(0);
  });
});
