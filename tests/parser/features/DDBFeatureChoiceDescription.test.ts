// Tests for the pure static that stops a DDB option whose description echoes its
// parent feature from being appended back onto that feature as a choice block.

// CharacterFeatureFactory must load first, it initialises the feature class chain
import "../../../src/parser/features/CharacterFeatureFactory";
import DDBFeature from "../../../src/parser/features/DDBFeature";

// The real Blood Hunter Brand of Axiom text: DDB ships this identically as both the
// class feature description and the description of the option synthesised for it.
const BRAND_OF_AXIOM = `<p>At 11th level, your mutagenic hemocraft lets your Brand of Castigation reveal a foe’s true nature. Any illusion or invisibility in effect on a creature when you brand it ends, and the creature can’t benefit from invisibility or illusion effects while branded by you. If a creature branded by you is in an alternative form (by way of the polymorph spell, the Change Shape action or Shapechanger trait, the Wild Shape feature, and similar effects), it must succeed on a Wisdom saving throw or revert to its true form and be stunned until the end of your next turn. Whenever a branded creature attempts to alter its form, it must succeed on a Wisdom saving throw or have the attempt fail, and it is stunned until the end of your next turn.</p>`;

describe("DDBFeature.isChoiceDescriptionRedundant", () => {
  beforeAll(() => {
    // utils.renderLesserString strips html via document.createElement, which the
    // node environment does not provide; stub a minimal tag-stripping element.
    vi.stubGlobal("document", {
      createElement: () => {
        const el: any = { textContent: "", innerText: "" };
        Object.defineProperty(el, "innerHTML", {
          set(html: string) {
            el.textContent = String(html).replace(/<[^>]*>/g, "");
          },
        });
        return el;
      },
    });
  });

  afterAll(() => {
    vi.unstubAllGlobals();
  });

  it("flags an option description identical to the parent", () => {
    expect(DDBFeature.isChoiceDescriptionRedundant(BRAND_OF_AXIOM, BRAND_OF_AXIOM)).toBe(true);
  });

  it("flags an identical option through markup, case and whitespace differences", () => {
    expect(DDBFeature.isChoiceDescriptionRedundant("<p>You gain a swimming speed equal to your walking speed.</p>", "you gain a   SWIMMING speed equal to your walking speed.")).toBe(true);
  });

  it("flags an option quoted inside a larger parent description", () => {
    const parent = `<p>Choose one of the following.</p>${BRAND_OF_AXIOM}<p>You can change this choice when you gain a level.</p>`;
    expect(DDBFeature.isChoiceDescriptionRedundant(parent, BRAND_OF_AXIOM)).toBe(true);
  });

  it("flags an option that DDB truncated and punctuated off mid-sentence", () => {
    // Pugilist Grotesque Growth: the option copy stops at "Long Rest." where the feature runs
    // on with "unless you take a level of Exhaustion", so it is a 214-of-215 character prefix
    const parent = `<p>When you use your Dread Hand feature, you gain the benefits of the Enlarge effect of the Enlarge/Reduce spell and have a 10-foot reach.</p>
<p>Once you use this feature, you can’t use it again until you finish a Long Rest unless you take a level of Exhaustion (no action required by you) to restore your use of it.</p>`;
    const choice = `<p>When you use your Dread Hand feature, you gain the benefits of the Enlarge effect of the Enlarge/Reduce spell and have a 10-foot reach.</p>
<p>Once you use this feature, you can’t use it again until you finish a Long Rest.</p>`;
    expect(DDBFeature.isChoiceDescriptionRedundant(parent, choice)).toBe(true);
  });

  it("keeps an option that only shares a prefix and then diverges", () => {
    const parent = `<p>When you use your Dread Hand feature, you gain the benefits of the Enlarge effect of the Enlarge/Reduce spell and have a 10-foot reach.</p>`;
    const choice = `<p>When you use your Dread Hand feature, you gain the benefits of the Reduce effect instead, and your reach drops to 0 feet.</p>`;
    expect(DDBFeature.isChoiceDescriptionRedundant(parent, choice)).toBe(false);
  });

  it("keeps a short contained option that could collide by coincidence", () => {
    const choice = "<p>You gain darkvision.</p>";
    // "you gain darkvision." normalises to 20 chars, under MIN_CHOICE_CONTAINMENT_LENGTH,
    // so containment does not count and only an exact match would suppress it
    expect(DDBFeature.MIN_CHOICE_CONTAINMENT_LENGTH).toBeGreaterThan(20);
    expect(DDBFeature.isChoiceDescriptionRedundant("<p>You gain darkvision. You also gain a swimming speed.</p>", choice)).toBe(false);
  });

  it("keeps an option whose text is genuinely different", () => {
    expect(DDBFeature.isChoiceDescriptionRedundant(BRAND_OF_AXIOM, "<p>Your brand deals an extra 1d6 radiant damage when the target fails its save against it.</p>")).toBe(false);
  });

  it("keeps an option when either side is empty", () => {
    expect(DDBFeature.isChoiceDescriptionRedundant("", BRAND_OF_AXIOM)).toBe(false);
    expect(DDBFeature.isChoiceDescriptionRedundant(BRAND_OF_AXIOM, "")).toBe(false);
    expect(DDBFeature.isChoiceDescriptionRedundant("<p> </p>", "<p> </p>")).toBe(false);
  });
});
