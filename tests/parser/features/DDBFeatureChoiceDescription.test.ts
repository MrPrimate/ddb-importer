// Tests for the pure static that stops a DDB option whose description echoes its
// parent feature from being appended back onto that feature as a choice block.

// CharacterFeatureFactory must load first, it initialises the feature class chain
import "../../../src/parser/features/CharacterFeatureFactory";
import DDBFeature from "../../../src/parser/features/DDBFeature";

// Stands in for a class feature DDB ships identically as both the feature description
// and the description of the option it synthesises for it (Blood Hunter's Brand of
// Axiom is the real case). Synthetic text of the same length so no book text ships.
const SIGIL_OF_UNMASKING = `<p>At 11th level, your sigil learns to see through deceit. Any disguise or veil affecting a creature when you mark it ends, and the creature cannot benefit from disguises or veils while your mark remains on it. If a marked creature is wearing a borrowed shape (by way of a shapechanging spell, a Change Shape action or Shapechanger trait, a druidic wild form, and similar effects), it must succeed on a Wisdom saving throw or return to its true shape and be stunned until the end of your next turn. Whenever a marked creature tries to take a new shape, it must succeed on a Wisdom saving throw or the attempt fails, and it is stunned until the end of your next turn.</p>`;

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
    expect(DDBFeature.isChoiceDescriptionRedundant(SIGIL_OF_UNMASKING, SIGIL_OF_UNMASKING)).toBe(true);
  });

  it("flags an identical option through markup, case and whitespace differences", () => {
    expect(DDBFeature.isChoiceDescriptionRedundant("<p>You gain a swimming speed equal to your walking speed.</p>", "you gain a   SWIMMING speed equal to your walking speed.")).toBe(true);
  });

  it("flags an option quoted inside a larger parent description", () => {
    const parent = `<p>Choose one of the following.</p>${SIGIL_OF_UNMASKING}<p>You can change this choice when you gain a level.</p>`;
    expect(DDBFeature.isChoiceDescriptionRedundant(parent, SIGIL_OF_UNMASKING)).toBe(true);
  });

  it("flags an option that DDB truncated and punctuated off mid-sentence", () => {
    // Seen on a third-party growth feature: the option copy stops at "Long Rest." where
    // the feature runs on with an alternative recovery clause, so it is a prefix that
    // differs only by the final sentence's tail
    const parent = `<p>When you use your Iron Grip feature, you gain the benefits of the Enlarge effect of the Enlarge/Reduce spell and have a 10-foot reach.</p>
<p>Once you use this feature, you can't use it again until you finish a Long Rest unless you spend a Hit Die (no action required by you) to restore your use of it.</p>`;
    const choice = `<p>When you use your Iron Grip feature, you gain the benefits of the Enlarge effect of the Enlarge/Reduce spell and have a 10-foot reach.</p>
<p>Once you use this feature, you can't use it again until you finish a Long Rest.</p>`;
    expect(DDBFeature.isChoiceDescriptionRedundant(parent, choice)).toBe(true);
  });

  it("keeps an option that only shares a prefix and then diverges", () => {
    const parent = `<p>When you use your Iron Grip feature, you gain the benefits of the Enlarge effect of the Enlarge/Reduce spell and have a 10-foot reach.</p>`;
    const choice = `<p>When you use your Iron Grip feature, you gain the benefits of the Reduce effect instead, and your reach drops to 0 feet.</p>`;
    expect(DDBFeature.isChoiceDescriptionRedundant(parent, choice)).toBe(false);
  });

  it("keeps a short contained option that could collide by coincidence", () => {
    const choice = "<p>You gain darkvision.</p>";
    // "you gain darkvision." normalises to 20 chars, under MIN_CHOICE_CONTAINMENT_LENGTH,
    // so containment does not count and only an exact match would suppress it
    expect(DDBFeature.MIN_CHOICE_CONTAINMENT_LENGTH).toBeGreaterThan(20);
    expect(DDBFeature.isChoiceDescriptionRedundant("<p>You gain darkvision. You also gain a swimming speed.</p>", choice)).toBe(false);
  });

  it("flags an option whose every sentence the parent repeats, between other text", () => {
    // Elemental Gift (Dao): the option repeats the parent's opening paragraph, which the parent
    // follows with more text, and its sentence breaks differ from the parent's markup
    const parent = "<p><em>6th-level Genie feature</em></p><p>You begin to take on characteristics of your patron's kind. You now have resistance to a damage type determined by your patron's kind.</p><p>In addition, as a bonus action, you can give yourself a flying speed of 30 feet.</p>";
    const choice = "<p>You now have resistance to a damage type determined by your patron's kind. You begin to take on characteristics of your patron's kind.</p>";
    expect(DDBFeature.isChoiceDescriptionRedundant(parent, choice)).toBe(true);
  });

  it("keeps an option that adds one sentence of its own", () => {
    const parent = "<p>You begin to take on characteristics of your patron's kind. You now have resistance to a damage type determined by your patron's kind.</p>";
    const choice = "<p>You begin to take on characteristics of your patron's kind. Your resistance is to bludgeoning damage, as a dao.</p>";
    expect(DDBFeature.isChoiceDescriptionRedundant(parent, choice)).toBe(false);
  });

  it("flags an option the parent lists among others after a colon", () => {
    // Master of Hell: each hellstorm option repeats the lead-in, then its own paragraph
    const parent = "<p>Choose one of the following effects, which fills a sphere centered on that point: Inferno. Hellfire rains down on your foes. Darkness. A bitter storm assails your foes.</p>";
    const choice = "<p>Choose one of the following effects, which fills a sphere centered on that point: Darkness. A bitter storm assails your foes.</p>";
    expect(DDBFeature.isChoiceDescriptionRedundant(parent, choice)).toBe(true);
  });

  it("keeps an option whose text is genuinely different", () => {
    expect(DDBFeature.isChoiceDescriptionRedundant(SIGIL_OF_UNMASKING, "<p>Your sigil deals an extra 1d6 radiant damage when the target fails its save against it.</p>")).toBe(false);
  });

  it("keeps an option when either side is empty", () => {
    expect(DDBFeature.isChoiceDescriptionRedundant("", SIGIL_OF_UNMASKING)).toBe(false);
    expect(DDBFeature.isChoiceDescriptionRedundant(SIGIL_OF_UNMASKING, "")).toBe(false);
    expect(DDBFeature.isChoiceDescriptionRedundant("<p> </p>", "<p> </p>")).toBe(false);
  });
});

describe("DDBFeature.isFeatureOptionChoice", () => {
  const option = (label: string, choiceType?: number) => ({ label, choiceType }) as IDDBChoiceResult;

  it("keeps feature options", () => {
    expect(DDBFeature.isFeatureOptionChoice(option("Mask of Many Faces", 3))).toBe(true);
    expect(DDBFeature.isFeatureOptionChoice(option("Necrotic Shroud"))).toBe(true);
  });

  it("drops ability, proficiency, spell, feat and subclass picks by DDB choice type", () => {
    for (const type of [1, 2, 4, 6, 7]) expect(DDBFeature.isFeatureOptionChoice(option("Anything", type))).toBe(false);
  });

  it("drops options naming an ability or damage type", () => {
    expect(DDBFeature.isFeatureOptionChoice(option("Drow Lineage - Charisma", 8))).toBe(false);
    expect(DDBFeature.isFeatureOptionChoice(option("Hemocraft Modifier: Wisdom", 3))).toBe(false);
    expect(DDBFeature.isFeatureOptionChoice(option("Cold Damage", 3))).toBe(false);
    expect(DDBFeature.isFeatureOptionChoice(option("Acid", 8))).toBe(false);
  });

  it("keeps a sense option, a feature benefit with its own text (The Third Eye)", () => {
    expect(DDBFeature.isFeatureOptionChoice(option("Darkvision", 3))).toBe(true);
  });
});
