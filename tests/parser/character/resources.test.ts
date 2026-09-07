import "../../../src/parser/character/resources";
import { makeMockCharacter } from "../../_fixtures/mockCharacter";
import { auditFixturesPresent, loadFixtureCharacter } from "../../_fixtures/ddb/auditCharacterFixtures";
import DDBCharacter from "../../../src/parser/DDBCharacter";

const EMPTY_RESOURCE = { value: 0, max: 0, sr: false, lr: false, label: "" };

// _generateResources -> getSortedByUsedResourceList -> resourceList all chain
// through `this`, so the mock needs the real prototype; resourceChoices and
// profBonus are normally set by the DDBCharacter constructor / proficiency
// parser and are provided directly here
function resourceMock(actions: Record<string, any>, {
  resourceChoices = { ask: false, type: "default", primary: "", secondary: "", tertiary: "" },
  profBonus = 3,
}: Record<string, any> = {}): any {
  const mock = makeMockCharacter({
    ddbCharacter: { actions: { race: [], class: [], feat: [], ...actions } },
  });
  Object.setPrototypeOf(mock, DDBCharacter.prototype);
  mock.resourceChoices = { ...resourceChoices };
  mock.profBonus = profBonus;
  return mock;
}

describe("DDBCharacter.resourceList (synthetic)", () => {
  it("keeps only actions with usable limitedUse data and drops Hypnotic Gaze", () => {
    const mock = resourceMock({
      class: [
        { name: "Rage", limitedUse: { maxUses: 6, numberUsed: 2, resetType: 2 } },
        { name: "NoUses", limitedUse: { maxUses: null, numberUsed: 0, resetType: 2 } },
        { name: "NoLimitedUse" },
        { name: "Hypnotic Gaze", limitedUse: { maxUses: 3, numberUsed: 0, resetType: 2 } },
      ],
      feat: [
        { name: "ProfFeat", limitedUse: { maxUses: 0, numberUsed: 0, useProficiencyBonus: true, resetType: 2 } },
      ],
    });
    expect(mock.resourceList().map((a: any) => a.name)).toEqual(["Rage", "ProfFeat"]);
  });

});

describe("DDBCharacter.getSortedByUsedResourceList (synthetic)", () => {
  it("computes value/max and rest flags, sorted by max uses descending", () => {
    const mock = resourceMock({
      class: [
        { name: "Small", limitedUse: { maxUses: 1, numberUsed: 1, resetType: 3 } },
        { name: "Rage", limitedUse: { maxUses: 6, numberUsed: 2, resetType: 2 } },
        { name: "Other", limitedUse: { maxUses: 2, numberUsed: 0, resetType: 4 } },
      ],
    });
    expect(mock.getSortedByUsedResourceList()).toEqual([
      // resetType 1 => sr+lr, 2/3 => lr only, anything else => neither
      { label: "Rage", value: 4, max: 6, sr: false, lr: true },
      { label: "Other", value: 2, max: 2, sr: false, lr: false },
      { label: "Small", value: 0, max: 1, sr: false, lr: true },
    ]);
  });

  it("adds the ability modifier for statModifierUsesId with the default operator", () => {
    const mock = resourceMock({
      class: [
        // statModifierUsesId 5 = wisdom
        { name: "WisPool", limitedUse: { maxUses: 0, numberUsed: 0, statModifierUsesId: 5, resetType: 1 } },
      ],
    });
    mock.raw.character.flags.ddbimporter.dndbeyond.effectAbilities.wis.value = 16;
    expect(mock.getSortedByUsedResourceList()).toEqual([
      { label: "WisPool", value: 3, max: 3, sr: true, lr: true },
    ]);
  });

  it("multiplies by the ability modifier when the stat operator is 2", () => {
    const mock = resourceMock({
      class: [
        { name: "DexPool", limitedUse: { maxUses: 2, numberUsed: 1, statModifierUsesId: 2, operator: 2, resetType: 2 } },
      ],
    });
    mock.raw.character.flags.ddbimporter.dndbeyond.effectAbilities.dex.value = 14;
    expect(mock.getSortedByUsedResourceList()).toEqual([
      { label: "DexPool", value: 3, max: 4, sr: false, lr: true },
    ]);
  });

  it("applies the proficiency bonus additively or multiplicatively", () => {
    const mock = resourceMock({
      class: [
        { name: "AddProf", limitedUse: { maxUses: 1, numberUsed: 0, useProficiencyBonus: true, resetType: 2 } },
        { name: "MulProf", limitedUse: { maxUses: 2, numberUsed: 0, useProficiencyBonus: true, proficiencyBonusOperator: 2, resetType: 1 } },
      ],
    }, { profBonus: 3 });
    expect(mock.getSortedByUsedResourceList()).toEqual([
      { label: "MulProf", value: 6, max: 6, sr: true, lr: true },
      { label: "AddProf", value: 4, max: 4, sr: false, lr: true },
    ]);
  });

  it("treats a maxUses of -1 as zero", () => {
    const mock = resourceMock({
      class: [
        { name: "NegOne", limitedUse: { maxUses: -1, numberUsed: 0, resetType: 2 } },
      ],
    });
    expect(mock.getSortedByUsedResourceList()).toEqual([
      { label: "NegOne", value: 0, max: 0, sr: false, lr: true },
    ]);
  });
});

describe("DDBCharacter._generateResources (synthetic)", () => {
  const actions = {
    class: [
      { name: "Rage", limitedUse: { maxUses: 6, numberUsed: 2, resetType: 2 } },
      { name: "Second Wind", limitedUse: { maxUses: 4, numberUsed: 0, resetType: 1 } },
    ],
  };

  it("fills the sheet slots with the top sorted resources by default", () => {
    const mock = resourceMock(actions);
    mock._generateResources();
    expect(mock.raw.character.system.resources).toEqual({
      primary: { label: "Rage", value: 4, max: 6, sr: false, lr: true },
      secondary: { label: "Second Wind", value: 4, max: 4, sr: true, lr: true },
      tertiary: EMPTY_RESOURCE,
    });
    // choices are stored back on the importer flags
    expect(mock.raw.character.flags.ddbimporter.resources).toEqual(mock.resourceChoices);
  });

  it("only fills as many slots as numberOfResources", () => {
    const mock = resourceMock(actions);
    mock._generateResources(2);
    expect(Object.keys(mock.raw.character.system.resources)).toEqual(["primary", "secondary"]);
  });

  it("looks up resources by label for custom choices, blanking unmatched names", () => {
    const mock = resourceMock(actions, {
      resourceChoices: { ask: false, type: "custom", primary: "Rage", secondary: "Nonexistent", tertiary: "" },
    });
    mock._generateResources();
    expect(mock.raw.character.system.resources).toEqual({
      primary: { label: "Rage", value: 4, max: 6, sr: false, lr: true },
      secondary: EMPTY_RESOURCE,
      tertiary: EMPTY_RESOURCE,
    });
  });

  it.each(["remove", "disable"])("writes empty resources for the %s choice type", (type) => {
    const mock = resourceMock(actions, {
      resourceChoices: { ask: false, type, primary: "", secondary: "", tertiary: "" },
    });
    mock._generateResources();
    expect(mock.raw.character.system.resources).toEqual({
      primary: EMPTY_RESOURCE,
      secondary: EMPTY_RESOURCE,
      tertiary: EMPTY_RESOURCE,
    });
  });
});

describe("DDBCharacter.setDefaultResources (synthetic)", () => {
  it("fills only as many choice slots as there are resources", () => {
    const mock = resourceMock({});
    mock.setDefaultResources([
      { label: "Rage", value: 4, max: 6, sr: false, lr: true },
      { label: "Second Wind", value: 4, max: 4, sr: true, lr: true },
    ]);
    expect(mock.resourceChoices.primary).toBe("Rage");
    expect(mock.resourceChoices.secondary).toBe("Second Wind");
    expect(mock.resourceChoices.tertiary).toBe("");
  });
});

describe.skipIf(!auditFixturesPresent())("DDBCharacter resources (audit fixtures)", () => {
  async function loadMonk(): Promise<any> {
    // level 20 Warrior of Mercy monk; real abilities parse gives wis 25 (+7)
    const mock = await loadFixtureCharacter("classes/monk", "Warrior-of-Mercy");
    mock.profBonus = 6;
    mock.resourceChoices = { ask: false, type: "default", primary: "", secondary: "", tertiary: "" };
    return mock;
  }

  it("sorts the monk resource pools by size", async () => {
    const mock = await loadMonk();
    expect(mock.getSortedByUsedResourceList()).toEqual([
      { label: "Focus Points", value: 20, max: 20, sr: true, lr: true },
      // wis modifier (+7) pool
      { label: "Flurry of Healing and Harm", value: 7, max: 7, sr: false, lr: true },
      { label: "Uncanny Metabolism", value: 1, max: 1, sr: false, lr: true },
      { label: "Hand of Ultimate Mercy", value: 1, max: 1, sr: false, lr: true },
    ]);
  });

  it("selects Focus Points as the primary sheet resource", async () => {
    const mock = await loadMonk();
    mock._generateResources();
    const resources = mock.raw.character.system.resources;
    expect(resources.primary).toEqual({ label: "Focus Points", value: 20, max: 20, sr: true, lr: true });
    expect(resources.secondary.label).toBe("Flurry of Healing and Harm");
    expect(resources.tertiary.label).toBe("Uncanny Metabolism");
  });
});
