// CharacterFeatureFactory must load first, it initialises the activity/feature class chain.
import "../../../src/parser/features/CharacterFeatureFactory";
import DDBActivityFactoryMixin from "../../../src/parser/activities/mixins/DDBActivityFactoryMixin";
import { installDocumentStub } from "../../_fixtures/ddb/stubs";

beforeAll(() => {
  // utils.stringKindaEqual strips html through document.createElement
  installDocumentStub();
});

const INHERITED = "<p>A short DDB snippet.</p>";

function makeParser({
  activities,
  description,
  inherited = [INHERITED],
}: {
  activities: Record<string, any>;
  description: { value?: string | null; chat?: string | null };
  inherited?: string[];
}) {
  const parser = Object.create(DDBActivityFactoryMixin.prototype);
  Object.assign(parser, {
    name: "Test Feature",
    data: { system: { activities, description } },
    _inheritedActivityDescriptions: new Set(inherited),
  });
  return parser;
}

describe("DDBActivityFactoryMixin._finaliseActivityDescriptions", () => {
  it("clears an inherited description that repeats the document's chat description", () => {
    const parser = makeParser({
      activities: { one: { name: "Use", description: { value: INHERITED } } },
      description: { chat: "A short DDB snippet.", value: "The long document description." },
    });

    parser._finaliseActivityDescriptions();

    expect(parser.data.system.activities.one.description.value).toBe("");
    expect(parser._inheritedActivityDescriptions.size).toBe(0);
  });

  it("clears an inherited description that repeats the document's full description", () => {
    // chat is set but differs, so a `chat || value` comparison would miss this one
    const parser = makeParser({
      activities: { one: { name: "Use", description: { value: INHERITED } } },
      description: { chat: "Something else entirely.", value: "A short DDB snippet." },
    });

    parser._finaliseActivityDescriptions();

    expect(parser.data.system.activities.one.description.value).toBe("");
  });

  it("clears an inherited description covering several labelled sections", () => {
    const wholeFeature = [
      "<p><strong>Ability Score Increase.</strong> Increase your Con. or Wis. by 1.</p>",
      "<p><strong>Bolstering Treats.</strong> Cook special treats.</p>",
    ].join("\n");
    const parser = makeParser({
      activities: { one: { name: "Eat Treat", description: { value: wholeFeature } } },
      description: { chat: "", value: "The long document description." },
      inherited: [wholeFeature],
    });

    parser._finaliseActivityDescriptions();

    expect(parser.data.system.activities.one.description.value).toBe("");
  });

  it("keeps an inherited summary that is shorter than the document description", () => {
    const parser = makeParser({
      activities: { one: { name: "Use", description: { value: INHERITED } } },
      description: { chat: "", value: "<p>A short DDB snippet.</p><p>And several more paragraphs of rules.</p>" },
    });

    parser._finaliseActivityDescriptions();

    expect(parser.data.system.activities.one.description.value).toBe(INHERITED);
  });

  it("never writes blank markup, which would suppress the native item fallback", () => {
    const parser = makeParser({
      activities: { one: { name: "Use", description: { value: INHERITED } } },
      description: { chat: "A short DDB snippet.", value: "" },
    });

    parser._finaliseActivityDescriptions();

    expect(parser.data.system.activities.one.description.value).toBe("");
    expect(parser.data.system.activities.one.description.value).not.toBe("<p></p>");
  });

  it("leaves an enricher-authored description alone", () => {
    const parser = makeParser({
      activities: {
        inheritedActivity: { name: "Use", description: { value: INHERITED } },
        authored: { name: "Other", description: { value: "A short DDB snippet." } },
      },
      description: { chat: "A short DDB snippet.", value: "" },
    });

    parser._finaliseActivityDescriptions();

    // the authored value is not a staged one, even though it reads the same
    expect(parser.data.system.activities.inheritedActivity.description.value).toBe("");
    expect(parser.data.system.activities.authored.description.value).toBe("A short DDB snippet.");
  });

  it("does nothing when nothing was staged", () => {
    const parser = makeParser({
      activities: { one: { name: "Use", description: { value: INHERITED } } },
      description: { chat: "A short DDB snippet.", value: "" },
      inherited: [],
    });

    parser._finaliseActivityDescriptions();

    expect(parser.data.system.activities.one.description.value).toBe(INHERITED);
  });
});
