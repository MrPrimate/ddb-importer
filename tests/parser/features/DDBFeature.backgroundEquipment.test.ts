// @vitest-environment jsdom
import "../../../src/parser/features/CharacterFeatureFactory";
import DDBFeature from "../../../src/parser/features/DDBFeature";
import logger from "../../../src/lib/Logger";

function definition(name: string, extra: Partial<IDDBItemDefinition> = {}): IDDBItemDefinition {
  return { id: 1, entityTypeId: 2103445194, name, gearTypeId: 11, ...extra } as IDDBItemDefinition;
}

function rule(definitions: IDDBItemDefinition[], extra: Partial<IDDBEquipmentRule> = {}): IDDBEquipmentRule {
  return { definitions, data: [], custom: null, instruction: null, gold: null, ruleType: 5,
    proficiencyRequired: false, quantity: 1, ...extra };
}

describe("background equipment categories", () => {
  it("uses the declared artisan category despite extra generic kits", () => {
    const choice = rule([definition("Smith's Tools"), definition("Research Scrolls")]);
    expect(DDBFeature.backgroundEquipmentCategory(choice, "A set of artisan’s tools")).toEqual({ type: "tool", key: "art" });
    expect(DDBFeature.backgroundEquipmentCategory(choice, "Choose a tool")).toBeNull();
  });

  it("recognizes instruments without treating all gear type 11 entries as games", () => {
    const choice = rule([definition("Flute"), definition("Mastercraft Instrument", { gearTypeId: 1, subType: "Musical Instrument" })]);
    expect(DDBFeature.backgroundEquipmentCategory(choice, "A musical instrument")).toEqual({ type: "tool", key: "music" });
    expect(DDBFeature.backgroundEquipmentCategory(rule([definition("Unknown Kit"), definition("Another Kit")]), "Choose")).toBeNull();
  });

  it("does not use an unrelated category from a bundle", () => {
    const choice = rule([definition("Flute"), definition("Lute")]);
    expect(DDBFeature.backgroundEquipmentCategory(choice, "Artisan's tools and another item")).toEqual({ type: "tool", key: "music" });
    const mixed = rule([definition("Flute"), definition("Sword", { filterType: "Weapon", categoryId: 2 })]);
    expect(DDBFeature.backgroundEquipmentCategory(mixed, "A musical instrument")).toBeNull();
  });

  it("keeps unrestricted weapon choices and narrower declared categories", () => {
    const choice = rule([definition("Club", { filterType: "Weapon", categoryId: 1 }), definition("Sword", { filterType: "Weapon", categoryId: 2 })]);
    expect(DDBFeature.backgroundEquipmentCategory(choice, "An inexpensive but unusual weapon")).toEqual({ type: "weapon", key: "" });
    expect(DDBFeature.backgroundEquipmentCategory(choice, "A simple weapon")).toEqual({ type: "weapon", key: "sim" });
    expect(DDBFeature.backgroundEquipmentCategory(choice, "Choose")).toBeNull();
  });

  it("falls back to a unanimous category and rejects partially unknown lists", () => {
    expect(DDBFeature.backgroundEquipmentCategory(rule([definition("Dice Set"), definition("Playing Cards")]), "Choose")).toEqual({ type: "tool", key: "game" });
    expect(DDBFeature.backgroundEquipmentCategory(rule([definition("Flute"), definition("Unknown", { gearTypeId: 1 })]), "Choose")).toBeNull();
  });

  it("preserves grouping, quantities, proficiency, bundled gold and alternative wealth", async () => {
    const stub = Object.assign(Object.create(DDBFeature.prototype) as DDBFeature, {
      ddbDefinition: { name: "Example Background" },
      ddbData: { backgroundEquipment: { slots: [{ name: "Choose", ruleSlots: [
        { name: "A musical instrument", rules: [
          rule([definition("Flute"), definition("Lute")], { quantity: 2, proficiencyRequired: true }),
          rule([definition("Example Item")], { quantity: 3, proficiencyRequired: true }),
          rule([], { gold: 7 }),
        ] },
        { name: "An unusual weapon", rules: [rule([definition("Club", { filterType: "Weapon", categoryId: 1 }), definition("Sword", { filterType: "Weapon", categoryId: 2 })])] },
        { name: "Money", rules: [rule([], { gold: 50 })] },
      ] }] } },
      data: { system: {} },
      _resolveBackgroundEquipmentUuids: async () => ({ "1-2103445194": "Compendium.test.items.Item.example" }),
    });
    await stub._generateBackgroundEquipment();
    const system = stub.data.system as I5eBackgroundSystemData;
    const entries = system.startingEquipment!;
    expect(system.wealth).toBe("50");
    const root = entries.find((entry) => entry.type === "OR")!;
    const groups = entries.filter((entry) => entry.type === "AND");
    expect(groups).toHaveLength(2);
    expect(groups.every((entry) => entry.group === root._id)).toBe(true);
    expect(entries.find((entry) => entry.type === "tool")).toMatchObject({ key: "music", count: 2, requiresProficiency: true, group: groups[0]._id });
    expect(entries.find((entry) => entry.type === "linked")).toMatchObject({ count: 3, requiresProficiency: true, group: groups[0]._id });
    expect(entries.find((entry) => entry.type === "currency")).toMatchObject({ count: 7, key: "gp", group: groups[0]._id });
    expect(entries.find((entry) => entry.type === "weapon")).toMatchObject({ key: "", group: groups[1]._id });
    expect(entries.map((entry) => entry.sort)).toEqual(entries.map((_, i) => (i + 1) * 100000));
  });

  it("warns with the failing background and slot", async () => {
    const warn = vi.spyOn(logger, "warn").mockImplementation(() => undefined);
    try {
      const stub = Object.assign(Object.create(DDBFeature.prototype) as DDBFeature, {
        ddbDefinition: { name: "Example Background" },
        ddbData: { backgroundEquipment: { slots: [{ ruleSlots: [{ name: "Mystery choice", rules: [rule([definition("Unknown"), definition("Another")])] }] }] } },
        data: { system: {} },
        _resolveBackgroundEquipmentUuids: async () => ({}),
      });
      await stub._generateBackgroundEquipment();
      expect(warn).toHaveBeenCalledWith(expect.stringContaining("Example Background: Mystery choice"), expect.objectContaining({ defs: ["Unknown", "Another"] }));
    } finally {
      warn.mockRestore();
    }
  });
});
