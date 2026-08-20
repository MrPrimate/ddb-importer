// @vitest-environment jsdom
// jsdom needed: generateBackground calls utils.stripHtml, which uses `document`
import "../../../src/parser/character/bio";
import { makeMockCharacter } from "../../_fixtures/mockCharacter";
import { auditFixturesPresent, loadFixtureCharacter } from "../../_fixtures/ddb/auditCharacterFixtures";
import DDBCharacter from "../../../src/parser/DDBCharacter";

function bioMock(ddbCharacter: Record<string, any>): any {
  const mock = makeMockCharacter({
    ddbCharacter: {
      traits: { personalityTraits: null, ideals: null, bonds: null, flaws: null, appearance: null },
      notes: { backstory: null },
      ...ddbCharacter,
    },
    rawSystem: { details: {} },
  });
  mock.getCharacteristics = DDBCharacter.prototype.getCharacteristics;
  return mock;
}

function details(mock: any) {
  return mock.raw.character.system.details;
}

describe("DDBCharacter.getBackgroundName", () => {
  it("uses the definition name for a standard background", () => {
    const mock = bioMock({
      background: { hasCustomBackground: false, definition: { name: "Acolyte" }, customBackground: null },
    });
    expect(DDBCharacter.prototype.getBackgroundName.call(mock)).toBe("Acolyte");
  });

  it("returns an empty string when no background is chosen", () => {
    const mock = bioMock({
      background: { hasCustomBackground: false, definition: null, customBackground: null },
    });
    expect(DDBCharacter.prototype.getBackgroundName.call(mock)).toBe("");
  });

  it("uses the custom background name when hasCustomBackground is set", () => {
    const mock = bioMock({
      background: { hasCustomBackground: true, definition: null, customBackground: { name: "Void Sailor" } },
    });
    expect(DDBCharacter.prototype.getBackgroundName.call(mock)).toBe("Void Sailor");
  });

  it("returns an empty string when the source is not loaded", () => {
    const mock = bioMock({});
    mock.source = undefined;
    expect(DDBCharacter.prototype.getBackgroundName.call(mock)).toBe("");
  });
});

describe("DDBCharacter trait/ideal/bond/flaw", () => {
  it("copies the four personality fields onto details", () => {
    const mock = bioMock({
      traits: {
        personalityTraits: "I idolize a hero.",
        ideals: "Tradition.",
        bonds: "My temple.",
        flaws: "I judge others harshly.",
        appearance: null,
      },
    });
    DDBCharacter.prototype._generateTrait.call(mock);
    DDBCharacter.prototype._generateIdeal.call(mock);
    DDBCharacter.prototype._generateBond.call(mock);
    DDBCharacter.prototype._generateFlaw.call(mock);
    expect(details(mock)).toEqual({
      trait: "I idolize a hero.",
      ideal: "Tradition.",
      bond: "My temple.",
      flaw: "I judge others harshly.",
    });
  });

  it("falls back to empty strings for unset personality fields", () => {
    const mock = bioMock({});
    DDBCharacter.prototype._generateTrait.call(mock);
    DDBCharacter.prototype._generateIdeal.call(mock);
    DDBCharacter.prototype._generateBond.call(mock);
    DDBCharacter.prototype._generateFlaw.call(mock);
    expect(details(mock)).toEqual({ trait: "", ideal: "", bond: "", flaw: "" });
  });

  it("does not throw without a details skeleton", () => {
    const mock = bioMock({});
    mock.raw.character.system.details = undefined;
    expect(() => DDBCharacter.prototype._generateTrait.call(mock)).not.toThrow();
  });
});

describe("DDBCharacter.getCharacteristics / _generateAppearance", () => {
  it("builds a newline-separated characteristics blurb", () => {
    const mock = bioMock({
      gender: "F", eyes: "Green", height: "5ft", faith: "Moradin", hair: "Red", skin: "Tan", age: 25, weight: 130,
    });
    expect(DDBCharacter.prototype.getCharacteristics.call(mock)).toBe(
      "Gender: F\nEyes: Green\nHeight: 5ft\nFaith: Moradin\nHair: Red\nSkin: Tan\nAge: 25\nWeight: 130\n",
    );
  });

  it("returns an empty blurb when no characteristics are set", () => {
    expect(DDBCharacter.prototype.getCharacteristics.call(bioMock({}))).toBe("");
  });

  it("appends the appearance text after the characteristics blurb", () => {
    const mock = bioMock({
      gender: "F",
      traits: { personalityTraits: null, ideals: null, bonds: null, flaws: null, appearance: "Very tall." },
    });
    DDBCharacter.prototype._generateAppearance.call(mock);
    expect(details(mock).appearance).toBe("Gender: F\n\nVery tall.");
  });

  it("uses only the appearance text when there are no characteristics", () => {
    const mock = bioMock({
      traits: { personalityTraits: null, ideals: null, bonds: null, flaws: null, appearance: "Very tall." },
    });
    DDBCharacter.prototype._generateAppearance.call(mock);
    expect(details(mock).appearance).toBe("Very tall.");
  });
});

describe("DDBCharacter._generateAlignment", () => {
  it("maps a DDB alignment id onto its name", () => {
    const mock = bioMock({ alignmentId: 1 });
    DDBCharacter.prototype._generateAlignment.call(mock);
    expect(details(mock).alignment).toBe("Lawful Good");
  });

  it("defaults to True Neutral when no alignment is set", () => {
    const mock = bioMock({});
    DDBCharacter.prototype._generateAlignment.call(mock);
    expect(details(mock).alignment).toBe("True Neutral");
  });

  it("leaves alignment unset for an unknown alignment id", () => {
    const mock = bioMock({ alignmentId: 999 });
    DDBCharacter.prototype._generateAlignment.call(mock);
    expect(details(mock).alignment).toBeUndefined();
  });
});

describe("DDBCharacter._generateBiography / _generateDescription", () => {
  it("wraps the backstory as the public and private biography", () => {
    const mock = bioMock({ notes: { backstory: "Raised by wolves." } });
    DDBCharacter.prototype._generateBiography.call(mock);
    expect(details(mock).biography).toEqual({
      public: "<h1>Backstory</h1><p>Raised by wolves.</p>",
      value: "<h1>Backstory</h1><p>Raised by wolves.</p>",
    });
  });

  it("produces an empty biography without a backstory", () => {
    const mock = bioMock({});
    DDBCharacter.prototype._generateBiography.call(mock);
    expect(details(mock).biography).toEqual({ public: "", value: "" });
  });

  it("copies physical description fields, blanking unset ones", () => {
    const mock = bioMock({ gender: "M", age: 40, hair: "None" });
    DDBCharacter.prototype._generateDescription.call(mock);
    expect(details(mock)).toEqual({
      gender: "M", age: 40, height: "", weight: "", eyes: "", skin: "", hair: "None",
    });
  });
});

describe("DDBCharacter.getBackgroundData", () => {
  it("wraps a standard background definition", () => {
    const mock = bioMock({
      background: {
        hasCustomBackground: false,
        definition: {
          id: 10,
          entityTypeId: 20,
          name: "Acolyte",
          description: "<p>You have spent your life in service.</p>",
          featureName: "Shelter of the Faithful",
          featureDescription: "<p>You command respect.</p>",
        },
        customBackground: null,
      },
    });
    const data = DDBCharacter.prototype.getBackgroundData.call(mock);
    expect(data.name).toBe("Background: Acolyte");
    expect(data.id).toBe(10);
    expect(data.entityTypeId).toBe(20);
    // the already-<p>-wrapped DDB description was once wrapped in a second <p>
    // (invalid nesting); HTML descriptions now pass through unwrapped
    expect(data.description).toBe(
      "<h1>Background: Acolyte</h1><p>You have spent your life in service.</p>"
      + "<h2>Shelter of the Faithful</h2><p>You command respect.</p>",
    );
    expect(data.definition.name).toBe("Background: Acolyte");
    expect(data.definition.originalDescription).toBe("<p>You have spent your life in service.</p>");
  });

  it("skips the feature heading when the feature description is blank html", () => {
    const mock = bioMock({
      background: {
        hasCustomBackground: false,
        definition: {
          id: 11,
          entityTypeId: 20,
          name: "Urchin",
          description: null,
          shortDescription: "Street life.\r\n",
          featureName: "City Secrets",
          featureDescription: "<p> </p>",
        },
        customBackground: null,
      },
    });
    const data = DDBCharacter.prototype.getBackgroundData.call(mock);
    expect(data.description).toBe("<h1>Background: Urchin</h1>Street life.");
  });

  it("wraps a plain-text homebrew description in a paragraph", () => {
    // custom backgrounds can carry free typed text with no markup; only those
    // get the <p> wrapper, HTML descriptions pass through untouched
    const mock = bioMock({
      background: {
        hasCustomBackground: true,
        definition: null,
        customBackground: {
          id: 55,
          entityTypeId: 66,
          name: "Sailor of the Void",
          description: "I grew up on the streets.",
          featuresBackground: null,
          characteristicsBackground: null,
        },
      },
    });
    const data = DDBCharacter.prototype.getBackgroundData.call(mock);
    expect(data.description).toBe(
      "<h1>Background: Sailor of the Void</h1><p>I grew up on the streets.</p>",
    );
  });

  it("builds a homebrew description from a custom background's features block", () => {
    const mock = bioMock({
      background: {
        hasCustomBackground: true,
        definition: null,
        customBackground: {
          id: 55,
          entityTypeId: 66,
          name: "Sailor of the Void",
          description: null,
          shortDescription: "A drifting soul.\r\n",
          featuresBackground: {
            id: 77,
            entityTypeId: 88,
            name: "Sailor",
            shortDescription: "Sea life.\r\n",
            featureName: "Ship's Passage",
            featureDescription: "<p>Free rides.</p>",
          },
          characteristicsBackground: null,
        },
      },
    });
    const data = DDBCharacter.prototype.getBackgroundData.call(mock);
    expect(data.name).toBe("Background: Sailor of the Void");
    // ids are re-pointed at the features background definition
    expect(data.id).toBe(77);
    expect(data.entityTypeId).toBe(66);
    expect(data.featuresId).toBe(77);
    expect(data.featuresEntityTypeId).toBe(88);
    expect(data.description).toBe(
      "<h1>Background: Sailor of the Void</h1>A drifting soul."
      + "<h2>Sailor</h2>Sea life.<h3>Ship's Passage</h3><p>Free rides.</p>",
    );
    expect(data.definition.entityTypeId).toBe(88);
  });

  it("returns a stub with ids when there is neither definition nor custom flag", () => {
    const mock = bioMock({
      background: {
        hasCustomBackground: false,
        definition: null,
        customBackground: { id: 5, entityTypeId: 9, name: null },
      },
    });
    const data = DDBCharacter.prototype.getBackgroundData.call(mock);
    expect(data.name).toBe("Background");
    expect(data.id).toBe(5);
    expect(data.entityTypeId).toBe(9);
    expect(data.definition.id).toBe(5);
    expect(data.description).toBe("");
  });
});

describe.skipIf(!auditFixturesPresent())("DDBCharacter bio (audit fixtures)", () => {
  async function acolyteMock(): Promise<any> {
    const mock = await loadFixtureCharacter("backgrounds", "-Acolyte-", { generateAbilities: false });
    mock.raw.character.system.details = {};
    return mock;
  }

  it("reads the background name from a real Acolyte capture", async () => {
    const mock = await acolyteMock();
    expect(mock.getBackgroundName()).toBe("Acolyte");
  });

  it("generates background data with the feature section from a real capture", async () => {
    const mock = await acolyteMock();
    const data = mock.getBackgroundData();
    expect(data.name).toBe("Background: Acolyte");
    expect(data.description.startsWith("<h1>Background: Acolyte</h1>")).toBe(true);
    expect(data.description).toContain("Shelter of the Faithful");
  });

  it("fills alignment and personality defaults for an unset mule capture", async () => {
    const mock = await acolyteMock();
    mock._generateAlignment();
    mock._generateTrait();
    mock._generateBiography();
    const result = details(mock);
    expect(result.alignment).toBe("True Neutral");
    expect(result.trait).toBe("");
    expect(result.biography).toEqual({ public: "", value: "" });
  });
});
