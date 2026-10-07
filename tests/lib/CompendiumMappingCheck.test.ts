import { describe, it, expect } from "vitest";
import { findDuplicateMappings, planMappingFix } from "../../src/lib/CompendiumMappingCheck";

const WORLD = "world.ddb-the-shattered-obelisk-ddb";

const TITLES: Record<string, string> = {
  background: "Backgrounds",
  class: "Classes",
  feat: "Feats",
  item: "Items",
  monster: "Monsters",
  vehicle: "Vehicles",
  species: "Species",
  effect: "Effects",
  spell: "Spells",
  table: "Tables",
  override: "Override",
  adventure: "Adventures",
  journal: "Journals",
  summons: "Summons",
};

// the mapping a user reported after another module rewrote the settings
const REPORTED: Record<string, string> = {
  background: `${WORLD}-backgrounds`,
  class: `${WORLD}-backgrounds`,
  feat: `${WORLD}-backgrounds`,
  item: `${WORLD}-backgrounds`,
  monster: `${WORLD}-monsters`,
  vehicle: `${WORLD}-monsters`,
  species: `${WORLD}-backgrounds`,
  effect: `${WORLD}-effects`,
  spell: `${WORLD}-backgrounds`,
  table: `${WORLD}-tables`,
  override: `${WORLD}-backgrounds`,
  adventure: "",
  journal: `${WORLD}-journals`,
  summons: `${WORLD}-monsters`,
};

function defaultId(key: string) {
  return `${WORLD}-${TITLES[key].toLowerCase()}`;
}

function entries(values: Record<string, string>, missingDefaults: string[] = []): ICompendiumMappingEntry[] {
  return Object.entries(values).map(([setting, value]) => ({
    setting,
    title: TITLES[setting],
    value,
    defaultPackId: missingDefaults.includes(setting) ? null : defaultId(setting),
  }));
}

function ddbPacks(missingDefaults: string[] = []) {
  return new Set(Object.keys(TITLES).filter((k) => !missingDefaults.includes(k)).map(defaultId));
}

function apply(values: Record<string, string>, plan: ICompendiumMappingPlan) {
  const result = { ...values };
  for (const change of plan.changes) result[change.setting] = change.to;
  return result;
}

describe("findDuplicateMappings", () => {
  it("groups settings sharing a compendium and ignores empty mappings", () => {
    const groups = findDuplicateMappings({ a: "x", b: "x", c: "", d: "", e: "y" });
    expect(groups).toEqual([{ packId: "x", settings: ["a", "b"] }]);
  });
});

describe("planMappingFix", () => {
  it("repoints every setting in the reported mapping to its own DDB compendium", () => {
    const plan = planMappingFix({ entries: entries(REPORTED), ddbPackIds: ddbPacks() });
    expect(plan.unresolved).toEqual([]);
    const fixed = apply(REPORTED, plan);
    for (const key of Object.keys(TITLES)) {
      expect(fixed[key]).toBe(key === "adventure" ? "" : defaultId(key));
    }
    expect(plan.changes.map((c) => c.setting).sort()).toEqual(
      ["class", "feat", "item", "species", "spell", "override", "vehicle", "summons"].sort(),
    );
  });

  it("reports a setting whose DDB compendium does not exist", () => {
    const plan = planMappingFix({ entries: entries(REPORTED, ["class"]), ddbPackIds: ddbPacks(["class"]) });
    expect(plan.unresolved).toEqual([{
      setting: "class",
      title: "Classes",
      packId: `${WORLD}-backgrounds`,
      reason: "no-default",
      sharedWith: ["Backgrounds", "Feats", "Items", "Species", "Spells", "Override"],
    }]);
    expect(plan.changes.find((c) => c.setting === "class")).toBeUndefined();
  });

  it("never moves a setting onto a compendium another setting uses", () => {
    // feats already sit in the classes compendium, so classes cannot take it back automatically
    const values = { background: defaultId("background"), class: defaultId("background"), feat: defaultId("class") };
    const plan = planMappingFix({ entries: entries(values), ddbPackIds: ddbPacks() });
    expect(plan.changes).toEqual([]);
    const fixed = apply(values, plan);
    expect(findDuplicateMappings(fixed).map((g) => g.settings)).toEqual([["background", "class"]]);
    expect(plan.unresolved.find((u) => u.setting === "class")?.reason).toBe("default-in-use");
  });

  it("leaves a compendium DDB Importer did not create for the user", () => {
    const values = { item: "world.my-loot", spell: "world.my-loot" };
    const plan = planMappingFix({ entries: entries(values), ddbPackIds: ddbPacks() });
    expect(plan.changes).toEqual([]);
    expect(plan.unresolved.map((u) => [u.setting, u.reason])).toEqual([["item", "non-ddb-pack"], ["spell", "non-ddb-pack"]]);
  });

  it("drops a setting that ends up holding the compendium alone", () => {
    // the shared pack belongs to neither setting; feat moves away, class has nowhere to go
    const values = { class: `${WORLD}-backgrounds`, feat: `${WORLD}-backgrounds` };
    const plan = planMappingFix({ entries: entries(values, ["class"]), ddbPackIds: ddbPacks(["class"]) });
    expect(plan.changes.map((c) => c.setting)).toEqual(["feat"]);
    expect(plan.unresolved).toEqual([]);
  });

  it("does nothing when there are no clashes", () => {
    const values = Object.fromEntries(Object.keys(TITLES).map((k) => [k, defaultId(k)]));
    expect(planMappingFix({ entries: entries(values), ddbPackIds: ddbPacks() })).toEqual({ changes: [], unresolved: [] });
  });
});
