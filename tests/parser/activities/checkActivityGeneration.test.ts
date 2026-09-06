// @vitest-environment jsdom
// _checkActivityGeneration gives a document one check activity per release check its rules text
// describes - the roll that frees a netted creature, or closes a Sword of Wounding's wounds.
// Scenery checks emit nothing. See docs/build/multi-roll-items.md.

// CharacterFeatureFactory must load first, it initialises the activity/feature class chain
import "../../../src/parser/features/CharacterFeatureFactory";
import DDBActivityFactoryMixin from "../../../src/parser/activities/mixins/DDBActivityFactoryMixin";

interface IGeneratorStub {
  name: string;
  additionalActivities: any[];
  enricher: { addAutoAdditionalActivities: boolean; additionalActivities: any[] };
  _checkGenerated: boolean;
}

function stubFor({
  enricherActivities = [] as any[],
  addAutoAdditionalActivities = true,
}: Record<string, any> = {}): IGeneratorStub {
  return {
    name: "Test Item",
    additionalActivities: [],
    enricher: { addAutoAdditionalActivities, additionalActivities: enricherActivities },
    _checkGenerated: false,
  };
}

function generate(text: string, options: Record<string, any> = {}, stub = stubFor(options)): any[] {
  (DDBActivityFactoryMixin.prototype as any)._checkActivityGeneration.call(stub, { text, maxExtras: options.maxExtras });
  return stub.additionalActivities;
}

const NET_2024 = "<p>The target must succeed on a Dexterity saving throw (DC 8 plus your Dexterity modifier and Proficiency Bonus) or have the Restrained condition until it escapes. "
  + "To escape, the target or a creature within 5 feet of it must take an action to make a DC 10 Strength (Athletics) check, freeing the Restrained creature on a success.</p>";

const WOUNDING_2014 = "<p>At the start of each of the wounded creature's turns, it takes 1d4 necrotic damage for each time you've wounded it, and it can then make a DC 15 Constitution saving throw, ending the effect of all such wounds on itself on a success. "
  + "Alternatively, the wounded creature, or a creature within 5 feet of it, can use an action to make a DC 15 Wisdom (Medicine) check, ending the effect of such wounds on it on a success.</p>";

const MANACLES_2024 = "<p>Escaping the Manacles requires a successful DC 20 Dexterity (Sleight of Hand) check as an action. "
  + "Bursting them requires a successful DC 25 Strength (Athletics) check as an action. "
  + "A creature proficient with thieves' tools can pick this lock with a successful DC 15 Dexterity check.</p>";

describe("_checkActivityGeneration - what it builds", () => {
  it("builds an Escape Check from the 2024 escape boilerplate", () => {
    const outlines = generate(NET_2024);

    expect(outlines).toHaveLength(1);
    const [escape] = outlines;
    expect(escape.type).toBe("check");
    expect(escape.name).toBe("Escape Check");
    expect(escape.options.checkOverride).toEqual({ ability: "str", associated: ["ath"], dc: { calculation: "", formula: "10" } });
    expect(escape.options.activationOverride).toEqual({ type: "action", value: 1, condition: "" });
    expect(escape.options.generateConsumption).toBe(false);
    expect(escape.options.generateTarget).toBe(false);
    expect(escape.options.noSpellslot).toBe(true);
    expect(escape.options.data.description.value).toContain("DC 10 Strength (Athletics) check");
    expect(escape.options.data.description.value).not.toContain("Dexterity saving throw");
  });

  it("names a wound-closing Medicine check after its skill", () => {
    const [medicine] = generate(WOUNDING_2014);

    expect(medicine.name).toBe("Medicine Check");
    expect(medicine.options.checkOverride.ability).toBe("wis");
    expect(medicine.options.checkOverride.associated).toEqual(["med"]);
  });

  it("suffixes the skill when two escape checks share a name, and ignores the lock-pick", () => {
    const outlines = generate(MANACLES_2024);

    expect(outlines.map((outline) => outline.name)).toEqual(["Escape Check (Sleight of Hand)", "Escape Check (Athletics)"]);
  });

  it("names a bare ability check after its ability", () => {
    const [outline] = generate("The creature can use its action to make a DC 16 Strength check, ending the restrained condition on a success.");

    expect(outline.name).toBe("Escape Check");
    expect(outline.options.checkOverride).toEqual({ ability: "str", associated: [], dc: { calculation: "", formula: "16" } });
  });

  it("leaves the ability blank when each of two abilities names its own skill", () => {
    const [outline] = generate(
      "A target Restrained by the rope can take an action to make its choice of a DC 15 Strength (Athletics) or Dexterity (Acrobatics) check. On a successful check, the target is no longer Restrained by the rope.",
    );

    expect(outline.options.checkOverride.ability).toBe("");
    expect(outline.options.checkOverride.associated).toEqual(["ath", "acr"]);
    expect(outline.options.activationOverride.condition).toBe("");
  });

  it("uses the first of two bare abilities and calls out the alternative", () => {
    const [outline] = generate(
      "A target restrained by the rope can use an action to make a DC 15 Strength or Dexterity check (target’s choice). On a success, the target is no longer restrained.",
    );

    expect(outline.options.checkOverride.ability).toBe("str");
    expect(outline.options.checkOverride.associated).toEqual([]);
    expect(outline.options.activationOverride.condition).toContain("Strength or Dexterity check");
    expect(outline.options.activationOverride.condition).toContain("Dexterity");
  });

  it("carries the outcome sentence into the description", () => {
    const [outline] = generate("The restrained target can use its action to make a DC 15 Strength check. On a success, the effect ends.");

    expect(outline.options.data.description.value).toBe("<p>The restrained target can use its action to make a DC 15 Strength check. On a success, the effect ends.</p>");
  });

  it("emits nothing for scenery checks", () => {
    expect(generate("A creature notices the caltrops with a successful DC 20 Wisdom (Perception) check.")).toEqual([]);
    expect(generate("either by making a successful attack roll against AC 24 or a successful DC 24 Dexterity (Acrobatics) check to free it.")).toEqual([]);
    expect(generate("A DC 25 Strength check is required to close it, pry it open, or tear out a page against its will.")).toEqual([]);
  });
});

describe("_checkActivityGeneration - the bare escape DC", () => {
  it("keeps the legacy shape for text that only says 'escape DC'", () => {
    const [outline] = generate("<p>The target is grappled (escape DC 15).</p>");

    expect(outline.name).toBe("Escape Check");
    expect(outline.options.checkOverride).toEqual({ ability: "", associated: ["acr", "ath"], dc: { calculation: "", formula: "15" } });
    expect(outline.options.activationOverride.type).toBe("action");
    expect(outline.options.data).toBeUndefined();
  });

  it("lets a sentence naming the same DC win over the bare wording", () => {
    const outlines = generate(
      "<p>The target is grappled (escape DC 15). To escape, it must take an action to make a DC 15 Strength (Athletics) check, freeing itself on a success.</p>",
    );

    expect(outlines).toHaveLength(1);
    expect(outlines[0].options.checkOverride.associated).toEqual(["ath"]);
  });
});

describe("_checkActivityGeneration - guards", () => {
  it("deduplicates a check restated at the same DC, but keeps a different DC", () => {
    expect(generate("make a DC 15 Strength (Athletics) check to escape. It can repeat the DC 15 Strength (Athletics) check to escape.")).toHaveLength(1);
    expect(generate("make a DC 15 Strength (Athletics) check to escape. It can repeat the DC 20 Strength (Athletics) check to escape.")).toHaveLength(2);
  });

  it("emits nothing when the enricher authors its own additional activities", () => {
    expect(generate(NET_2024, { enricherActivities: [{ name: "Escape" }] })).toEqual([]);
  });

  it("emits nothing when the enricher turns auto activities off", () => {
    expect(generate(NET_2024, { addAutoAdditionalActivities: false })).toEqual([]);
  });

  it("emits once even when a document passes through more than one build path", () => {
    const stub = stubFor();
    generate(NET_2024, {}, stub);
    generate(NET_2024, {}, stub);
    expect(stub.additionalActivities).toHaveLength(1);
  });

  it("leaves a document with more release checks than the cap to an enricher", () => {
    const text = [15, 16, 17, 18].map((dc) => `A creature can make a DC ${dc} Strength check to escape.`).join(" ");
    expect(generate(text)).toEqual([]);
    expect(generate(text, { maxExtras: 4 })).toHaveLength(4);
  });

  it("ignores checks that are rows of a random table", () => {
    expect(generate("<table><tr><td>It takes a successful DC 20 Strength check to free yourself.</td></tr></table>")).toEqual([]);
  });

  it("emits nothing for empty text", () => {
    expect(generate("")).toEqual([]);
  });
});
