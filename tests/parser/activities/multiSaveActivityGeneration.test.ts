// @vitest-environment jsdom
// _multiSaveActivityGeneration gives a document that describes several saving throws one
// activity per property. Only the first save reaches the single-save parsers, so before this
// everything else an item did existed only as prose - see docs/multi-roll-items.md.

// CharacterFeatureFactory must load first, it initialises the activity/feature class chain
import "../../../src/parser/features/CharacterFeatureFactory";
import DDBActivityFactoryMixin from "../../../src/parser/activities/mixins/DDBActivityFactoryMixin";

interface IGeneratorStub {
  name: string;
  additionalActivities: any[];
  enricher: { addAutoAdditionalActivities: boolean; additionalActivities: any[] };
  _saveBearingSections: (text: string) => any[];
}

function generate(text: string, {
  primarySave = null,
  skipFirstSection = true,
  enricherActivities = [] as any[],
  addAutoAdditionalActivities = true,
  ...rest
}: Record<string, any> = {}): any[] {
  const stub: IGeneratorStub = {
    name: "Test Item",
    additionalActivities: [],
    enricher: { addAutoAdditionalActivities, additionalActivities: enricherActivities },
    _saveBearingSections: (DDBActivityFactoryMixin.prototype as any)._saveBearingSections,
  };
  (DDBActivityFactoryMixin.prototype as any)._multiSaveActivityGeneration.call(stub, {
    text, primarySave, skipFirstSection, ...rest,
  });
  return stub.additionalActivities;
}

const ARCANE_CANNON = [
  "<p>This Large cannon is imbued with magic.</p>",
  "<p><strong>Acid Jet.</strong> Each creature in that line must make a DC 15 Dexterity saving throw,",
  " taking 22 (4d10) acid damage on a failed save, or half as much damage on a successful one.</p>",
  "<p><strong>Frost Shot.</strong> Each creature must make a DC 15 Constitution saving throw.",
  " On a failed save, a creature takes 22 (4d10) cold damage.</p>",
  "<p><strong>Poison Spray.</strong> The cannon expels poison gas in a 60-foot cone.",
  " Each creature must make a DC 15 Constitution saving throw.</p>",
].join("");

describe("_multiSaveActivityGeneration - sectioned text", () => {
  it("names an activity after each section beyond the first", () => {
    const outlines = generate(ARCANE_CANNON);

    expect(outlines.map((outline) => outline.name)).toEqual(["Frost Shot", "Poison Spray"]);
    expect(outlines.every((outline) => outline.type === "save")).toBe(true);
    expect(outlines[0].options.saveOverride).toEqual({ ability: ["con"], dc: { calculation: "", formula: "15" } });
  });

  it("gives each activity the damage of its own section", () => {
    const [frostShot, poisonSpray] = generate(ARCANE_CANNON);

    expect(frostShot.options.damageParts).toHaveLength(1);
    expect(frostShot.options.damageParts[0].number).toBe(4);
    expect(frostShot.options.damageParts[0].types).toEqual(["cold"]);
    expect(frostShot.options.generateDamage).toBe(true);
    // Poison Spray names no damage of its own, so it must not inherit Frost Shot's
    expect(poisonSpray.options.damageParts).toEqual([]);
    expect(poisonSpray.options.generateDamage).toBe(false);
  });

  it("keeps every section when the primary describes something else, such as a weapon attack", () => {
    expect(generate(ARCANE_CANNON, { skipFirstSection: false }).map((outline) => outline.name))
      .toEqual(["Acid Jet", "Frost Shot", "Poison Spray"]);
  });

  it("reads a half-on-save rider from the section it belongs to", () => {
    const [acidJet, frostShot] = generate(ARCANE_CANNON, { skipFirstSection: false });

    expect(acidJet.options.onSave).toBe("half");
    expect(frostShot.options.onSave).toBe("none");
  });

  it("does not add description values to section activities", () => {
    const [frostShot, poisonSpray] = generate(ARCANE_CANNON);

    expect(frostShot.options.data?.description?.value).toBeUndefined();
    expect(poisonSpray.options.data?.description?.value).toBeUndefined();
  });

  it("leaves the description alone in flat mode, where no section owns the text", () => {
    const text = "<p>Anyone who can see you must succeed on a DC 19 Wisdom saving throw."
      + " Each creature in that area must make a DC 19 Constitution saving throw.</p>";
    const [conSave] = generate(text, { primarySave: { ability: ["wis"], dc: { calculation: "", formula: "19" } } });

    expect(conSave.name).toBe("Con Save");
    expect(conSave.options.data).toBeUndefined();
  });

  it("asks the caller for a per-section target and omits it when the section names no area", () => {
    const outlines = generate(ARCANE_CANNON, {
      targetOverrideForSection: (section: string) => section.includes("60-foot cone")
        ? { template: { type: "cone", size: "60" } }
        : null,
    });

    expect(outlines[0].options.targetOverride).toBeUndefined();
    expect(outlines[1].options.targetOverride).toEqual({ template: { type: "cone", size: "60" } });
  });

  it("ignores a save restated later in the same section", () => {
    const text = [
      "<p><strong>Vile Miasma.</strong> A DC 16 Constitution saving throw. It repeats the",
      " DC 16 Constitution saving throw at the end of each of its turns.</p>",
      "<p><strong>Fanned Flames.</strong> A DC 16 Dexterity saving throw.</p>",
    ].join("");

    expect(generate(text).map((outline) => outline.name)).toEqual(["Fanned Flames"]);
  });

  it("falls back to the ability name when the label is a prerequisite clause", () => {
    const text = [
      "<p><strong>(Prerequisite: 8th level, Fey Ancestry trait or the fey creature type)</strong>",
      " a DC 16 Charisma saving throw.</p>",
      "<p><strong>(Prerequisite: Slay Malfuriel the Betrayer)</strong> a DC 16 Constitution saving throw.</p>",
    ].join("");

    expect(generate(text).map((outline) => outline.name)).toEqual(["Con Save"]);
  });

  it("strips the quotes DDB wraps a spoken command word in", () => {
    const text = [
      "<p><em><strong>&ldquo;Cower.&rdquo;</strong></em> a DC 17 Wisdom saving throw.</p>",
      "<p><em><strong>&ldquo;Survive.&rdquo;</strong></em> a DC 15 Wisdom saving throw.</p>",
    ].join("");

    expect(generate(text, { skipFirstSection: false }).map((outline) => outline.name))
      .toEqual(["Cower", "Survive"]);
  });
});

describe("_multiSaveActivityGeneration - flat text", () => {
  const MANY_HANDS = "<p>Anyone who can see you must succeed on a DC 19 Wisdom saving throw or be frightened."
    + " Each creature in that area must make a DC 19 Constitution saving throw.</p>";

  it("names each remaining save after its ability", () => {
    const outlines = generate(MANY_HANDS, {
      primarySave: { ability: ["wis"], dc: { calculation: "", formula: "19" } },
    });

    expect(outlines.map((outline) => outline.name)).toEqual(["Con Save"]);
  });

  it("joins the halves of an either/or save", () => {
    const text = "a DC 15 Dexterity saving throw. Later, a DC 15 Strength or Dexterity saving throw.";

    expect(generate(text, { primarySave: { ability: ["dex"], dc: { calculation: "", formula: "15" } } })
      .map((outline) => outline.name)).toEqual(["Str/Dex Save"]);
  });

  it("deduplicates a save restated at the same DC", () => {
    const text = "make a DC 15 Constitution saving throw. It repeats the DC 15 Constitution save each turn.";

    expect(generate(text, { primarySave: { ability: ["con"], dc: { calculation: "", formula: "15" } } }))
      .toEqual([]);
  });

  it("separates the same ability asked for at a different DC", () => {
    const text = "a DC 13 Wisdom saving throw. Later, a DC 18 Wisdom saving throw.";

    expect(generate(text, { primarySave: { ability: ["wis"], dc: { calculation: "", formula: "13" } } })
      .map((outline) => outline.name)).toEqual(["Wis Save"]);
  });
});

describe("_multiSaveActivityGeneration - guards", () => {
  it("emits nothing when the enricher authors its own additional activities", () => {
    expect(generate(ARCANE_CANNON, { enricherActivities: [{ init: { name: "Hand built" } }] })).toEqual([]);
  });

  it("emits nothing when the enricher turns auto activities off", () => {
    expect(generate(ARCANE_CANNON, { addAutoAdditionalActivities: false })).toEqual([]);
  });

  it("ignores saves that are rows of a random table", () => {
    const text = "<p>Roll on the table.</p><table>"
      + "<tr><td>1</td><td>a DC 15 Constitution saving throw</td></tr>"
      + "<tr><td>2</td><td>a DC 20 Dexterity saving throw</td></tr></table>";

    expect(generate(text)).toEqual([]);
  });

  it("trusts a labelled section list well past the flat cap - an eye ray table is ten modes", () => {
    const text = Array.from({ length: 8 }, (_v, index) =>
      `<p><strong>Mode ${index}.</strong> a DC 1${index} Wisdom saving throw.</p>`).join("");

    expect(generate(text, { skipFirstSection: false })).toHaveLength(8);
  });

  it("leaves a document with more sections than the ceiling to an enricher", () => {
    const text = Array.from({ length: 11 }, (_v, index) =>
      `<p><strong>Mode ${index}.</strong> a DC ${10 + index} Wisdom saving throw.</p>`).join("");

    // the ceiling is applied in _saveBearingSections, so nothing downstream sees this as
    // multi-mode at all - the primary keeps its own name and scope
    const stub: any = { _saveBearingSections: (DDBActivityFactoryMixin.prototype as any)._saveBearingSections };
    expect(stub._saveBearingSections(text)).toEqual([]);
    expect(generate(text, { skipFirstSection: false })).toEqual([]);
  });

  it("caps a long run of loose saves, which is far more likely to be a table", () => {
    const text = Array.from({ length: 7 }, (_v, index) =>
      `A DC ${10 + index} Wisdom saving throw.`).join(" ");

    expect(generate(text)).toEqual([]);
    expect(generate(text, { maxExtras: 7 })).toHaveLength(7);
  });

  it("emits nothing for a single-save document", () => {
    expect(generate("<p>A DC 15 Dexterity saving throw.</p>")).toEqual([]);
    expect(generate("")).toEqual([]);
  });

  it("emits once even when a document passes through more than one build path", () => {
    const stub: any = {
      name: "Test Item",
      additionalActivities: [],
      enricher: { addAutoAdditionalActivities: true, additionalActivities: [] },
      _saveBearingSections: (DDBActivityFactoryMixin.prototype as any)._saveBearingSections,
    };
    const run = (): void => (DDBActivityFactoryMixin.prototype as any)
      ._multiSaveActivityGeneration.call(stub, { text: ARCANE_CANNON });

    run();
    run();
    expect(stub.additionalActivities.map((outline: any) => outline.name)).toEqual(["Frost Shot", "Poison Spray"]);
  });

  it("passes noSpellslot through so a spell's extras consume no slot", () => {
    const outlines = generate(ARCANE_CANNON, { noSpellslot: true });

    expect(outlines.every((outline) => outline.options.noSpellslot === true)).toBe(true);
    expect(generate(ARCANE_CANNON)[0].options.noSpellslot).toBeUndefined();
  });
});
