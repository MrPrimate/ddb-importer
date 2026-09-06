// CharacterFeatureFactory must load first, it initialises the activity/feature class chain.
import "../../../src/parser/features/CharacterFeatureFactory";
import DDBBasicActivity from "../../../src/parser/activities/DDBBasicActivity";
import { installActivityConfigStubs } from "../../_fixtures/ddb/stubs";
import { setMockSettings } from "../../_setup/foundryMocks";

beforeAll(() => {
  installActivityConfigStubs();
});

const quietBuild = {
  generateConsumption: false,
  generateDuration: false,
  generateEffects: false,
  generateRange: false,
  generateTarget: false,
};

function makeActivity({
  snippet = "A short DDB snippet.",
  description = "The complete DDB description.",
  isAction = false,
}: {
  snippet?: string | null;
  description?: string;
  isAction?: boolean;
} = {}) {
  const ddbParent: any = {
    ddbData: {
      character: {
        options: { race: [], class: [], feat: [] },
      },
    },
    rawCharacter: {
      type: "character",
      flags: { ddbimporter: { dndbeyond: { templateStrings: [] } } },
    },
    data: {
      name: "Test Feature",
      system: {
        chatFlavor: "Existing chat flavor",
        description: { value: "The imported document description." },
      },
    },
    ddbDefinition: {
      id: 1,
      entityTypeId: 1,
      componentId: 1,
      componentTypeId: 1,
      name: "Test Feature",
      description,
      snippet,
    },
    isAction,
  };
  return new DDBBasicActivity({
    type: "utility",
    name: "Use Feature",
    ddbParent,
  });
}

describe("DDB activity snippet descriptions", () => {
  it("does not add snippets when the setting is disabled", () => {
    // The shared test mock returns the truthy placeholder "OFF" for an unset
    // setting, so this also pins the production code's strict true gate.
    const activity = makeActivity();
    activity.build(quietBuild);

    expect(activity.data.description?.value).toBeUndefined();
  });

  it("adds the source definition snippet without copying its full description", () => {
    setMockSettings({ "add-ddb-snippets-to-activities": true });
    const activity = makeActivity();
    activity.build(quietBuild);

    expect(activity.data.description?.value).toBe("<p>A short DDB snippet.</p>");
    expect(activity.data.description?.value).not.toContain("complete DDB description");
    expect(activity.data.description?.value).not.toContain("imported document description");
  });

  it("uses the parser-resolved snippet when one is available", () => {
    setMockSettings({ "add-ddb-snippets-to-activities": true });
    const activity = makeActivity({ snippet: "Raw {{scalevalue}} snippet." });
    (activity.ddbParent as any).snippet = "Resolved [[/roll @scale.test.value]] snippet.";
    activity.build(quietBuild);

    expect(activity.data.description?.value).toBe("<p>Resolved [[/roll @scale.test.value]] snippet.</p>");
  });

  it("parses template strings in a raw source snippet", () => {
    setMockSettings({ "add-ddb-snippets-to-activities": true });
    const activity = makeActivity({ snippet: "A {{fixedvalue:7}} point snippet." });
    activity.build(quietBuild);

    expect(activity.data.description?.value).toBe("<p>A [[7]] point snippet.</p>");
  });

  it("does not fall back to a non-action definition's full description", () => {
    setMockSettings({ "add-ddb-snippets-to-activities": true });
    const activity = makeActivity({ snippet: null });
    activity.build(quietBuild);

    expect(activity.data.description?.value).toBeUndefined();
  });

  it("falls back to the action description for an action-derived activity", () => {
    setMockSettings({ "add-ddb-snippets-to-activities": true });
    const activity = makeActivity({
      snippet: null,
      description: "The complete DDB description has {{fixedvalue:3}} parts.",
      isAction: true,
    });
    activity.build(quietBuild);

    expect(activity.data.description?.value).toBe("<p>The complete DDB description has [[3]] parts.</p>");
  });

  it("uses the parser-resolved action description when the action has no snippet", () => {
    setMockSettings({ "add-ddb-snippets-to-activities": true });
    const activity = makeActivity({ snippet: null, isAction: true });
    (activity.ddbParent as any).description = "Resolved action description.";
    activity.build(quietBuild);

    expect(activity.data.description?.value).toBe("<p>Resolved action description.</p>");
  });

  it("preserves chat flavor and lets explicit activity data win", () => {
    setMockSettings({ "add-ddb-snippets-to-activities": true });
    const activity = makeActivity();
    activity.build({
      ...quietBuild,
      generateDescription: true,
      data: {
        description: {
          value: "Explicit activity instructions.",
        },
      },
    });

    expect(activity.data.description).toEqual({
      chatFlavor: "Existing chat flavor",
      value: "Explicit activity instructions.",
    });
  });

  it("leaves monster activities empty so the item description is used on the card", () => {
    setMockSettings({ "add-ddb-snippets-to-activities": true });
    const ddbParent: any = {
      data: { name: "Bite", system: { description: { value: "The imported monster action description." } } },
      rawCharacter: { type: "npc" },
      html: "<em>Melee Weapon Attack:</em> +5 to hit. Hit: 7 (2d6) piercing damage.",
      isAction: null,
    };
    const activity = new DDBBasicActivity({ type: "attack", name: "Bite", ddbParent });
    activity.build(quietBuild);

    expect(activity.data.description?.value).toBeUndefined();
  });

  it("parses template strings without a character context (muncher imports)", () => {
    setMockSettings({ "add-ddb-snippets-to-activities": true });
    const activity = makeActivity({ snippet: "A {{fixedvalue:7}} point snippet." });
    delete (activity.ddbParent as any).rawCharacter;
    activity.build(quietBuild);

    expect(activity.data.description?.value).toBe("<p>A [[7]] point snippet.</p>");
  });

  it("still restores paragraphs when no DDB data is available to parse", () => {
    setMockSettings({ "add-ddb-snippets-to-activities": true });
    const activity = makeActivity({ snippet: "A plain snippet." });
    delete (activity.ddbParent as any).ddbData;
    delete (activity.ddbParent as any).rawCharacter;
    activity.build(quietBuild);

    expect(activity.data.description?.value).toBe("<p>A plain snippet.</p>");
  });
  it("restores the paragraphs DDB encodes as blank lines and marks a bare label up", () => {
    setMockSettings({ "add-ddb-snippets-to-activities": true });
    const activity = makeActivity({
      snippet: "Intro text.\r\n\r\nBolstering Treats. Cook the treats.",
    });
    activity.build(quietBuild);

    expect(activity.data.description?.value).toBe(
      "<p>Intro text.</p>\n<p><strong>Bolstering Treats.</strong> Cook the treats.</p>",
    );
  });

  it("leaves a snippet that already carries block markup alone", () => {
    setMockSettings({ "add-ddb-snippets-to-activities": true });
    const activity = makeActivity({ snippet: "<p>Already a paragraph.</p>" });
    activity.build(quietBuild);

    expect(activity.data.description?.value).toBe("<p>Already a paragraph.</p>");
  });

  it("stages the inherited value for the parent's description cleanup", () => {
    setMockSettings({ "add-ddb-snippets-to-activities": true });
    const activity = makeActivity();
    const inherited = new Set<string>();
    (activity.ddbParent as any)._inheritedActivityDescriptions = inherited;
    activity.build(quietBuild);

    expect([...inherited]).toEqual(["<p>A short DDB snippet.</p>"]);
  });
});
