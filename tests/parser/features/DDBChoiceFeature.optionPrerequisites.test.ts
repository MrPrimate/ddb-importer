// @vitest-environment jsdom
// An option's prerequisite line sets its level and the items an ItemChoice checks, in the shape
// the SRD invocations carry (`feat:<identifier>`).

// CharacterFeatureFactory must load first, it initialises the feature class chain
import "../../../src/parser/features/CharacterFeatureFactory";
import DDBChoiceFeature from "../../../src/parser/features/DDBChoiceFeature";

function stub(originalName: string, label: string, parentName: string, prerequisites: any): any {
  const option: any = {
    originalName,
    klass: "Warlock",
    ddbDefinition: { name: parentName },
    _currentChoice: { label },
    data: { name: originalName, system: { prerequisites } },
  };
  option._optionIdentifier = DDBChoiceFeature.prototype._optionIdentifier.bind(option);
  return option;
}

function build(originalName: string, label: string, description: string, {
  parentName = "Eldritch Invocations",
  prerequisites = { level: 1, items: [], repeatable: false } as any,
} = {}) {
  const option = stub(originalName, label, parentName, prerequisites);
  DDBChoiceFeature.prototype._generateOptionPrerequisites.call(option, { label, description } as any);
  return option.data.system.prerequisites;
}

function identifier(originalName: string, label: string, parentName = "Eldritch Invocations") {
  const option = stub(originalName, label, parentName, {});
  return DDBChoiceFeature.prototype._defaultIdentifier.call(option);
}

describe("DDBChoiceFeature.parseOptionPrerequisites", () => {
  it("reads the 2024 level and invocation", () => {
    expect(DDBChoiceFeature.parseOptionPrerequisites(
      "<p><em>Prerequisite: Level 12+ Warlock, Thirsting Blade Invocation</em></p><p>Text.</p>",
    )).toEqual({ level: 12, invocations: ["Thirsting Blade"], features: [] });
  });

  it("reads the 2014 ordinal level and feature, including a level outside the emphasis", () => {
    expect(DDBChoiceFeature.parseOptionPrerequisites(
      "<p class=\"x\"><em>Prerequisite:&nbsp;15th level, Pact of the Chain feature</em></p>",
    )).toEqual({ level: 15, invocations: [], features: ["Pact of the Chain"] });
    expect(DDBChoiceFeature.parseOptionPrerequisites(
      "<p><em><strong>Prerequisite:</strong></em> 7th level</p>",
    )).toEqual({ level: 7, invocations: [], features: [] });
    expect(DDBChoiceFeature.parseOptionPrerequisites(
      "<p><em>Prerequisite: 12th-level warlock, Pact of the Talisman feature</em></p>",
    )).toEqual({ level: 12, invocations: [], features: ["Pact of the Talisman"] });
  });

  it("leaves out conditions naming no single item", () => {
    expect(DDBChoiceFeature.parseOptionPrerequisites(
      "<p><em>Prerequisite: Level 2+ Warlock, a Warlock Cantrip That Deals Damage</em></p>",
    )).toEqual({ level: 2, invocations: [], features: [] });
    expect(DDBChoiceFeature.parseOptionPrerequisites(
      "<p><em>Prerequisite: 5th level, hex spell or a warlock feature that curses</em></p>",
    )).toEqual({ level: 5, invocations: [], features: [] });
    expect(DDBChoiceFeature.parseOptionPrerequisites("<p>You gain a benefit.</p>"))
      .toEqual({ level: null, invocations: [], features: [] });
  });
});

describe("DDBChoiceFeature._generateOptionPrerequisites", () => {
  it("names a sibling invocation by its own identifier", () => {
    expect(build(
      "Eldritch Invocations: Devouring Blade",
      "Devouring Blade",
      "<p><em>Prerequisite: Level 12+ Warlock, Thirsting Blade Invocation</em></p>",
    )).toEqual({ level: 12, items: ["feat:thirsting-blade"], repeatable: false });
  });

  it("names a sibling option with the parent's prefix outside OPTION_NAME_IDENTIFIERS", () => {
    expect(build(
      "Some Options: Second",
      "Second",
      "<p><em>Prerequisite: First Invocation</em></p>",
      { parentName: "Some Options" },
    ).items).toEqual(["feat:some-options-first"]);
  });

  it("names a feature by its own name", () => {
    expect(build(
      "Eldritch Invocations: Thirsting Blade",
      "Thirsting Blade",
      "<p><em>Prerequisite: 5th level, Pact of the Blade feature</em></p>",
    )).toEqual({ level: 5, items: ["feat:pact-of-the-blade"], repeatable: false });
  });

  it("keeps the parent's level when the line gives none", () => {
    expect(build(
      "Eldritch Invocations: Book of Ancient Secrets",
      "Book of Ancient Secrets",
      "<p><em>Prerequisite: Pact of the Tome feature</em></p>",
      { prerequisites: { level: 2, repeatable: false } },
    )).toEqual({ level: 2, items: ["feat:pact-of-the-tome"], repeatable: false });
  });
});

describe("DDBChoiceFeature._defaultIdentifier", () => {
  it("gives invocations the SRD's identifier, without DDB's bracketed pick", () => {
    expect(identifier("Eldritch Invocations: Thirsting Blade", "Thirsting Blade")).toBe("thirsting-blade");
    expect(identifier("Eldritch Invocations: Agonizing Blast (Eldritch Blast)", "Agonizing Blast (Eldritch Blast)"))
      .toBe("agonizing-blast");
    expect(identifier("Eldritch Invocations: Devil\u2019s Sight", "Devil\u2019s Sight")).toBe("devils-sight");
  });

  it("keeps the prefixed identifier for other options", () => {
    expect(identifier("Metamagic Options: Quickened Spell", "Quickened Spell", "Metamagic Options"))
      .toBe("metamagic-options-quickened-spell");
  });
});
