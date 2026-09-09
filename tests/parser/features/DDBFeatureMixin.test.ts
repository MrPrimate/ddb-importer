// Characterization tests for the pure static surface of DDBFeatureMixin:
// buildFullDescription and getFeatureSubtype.

// CharacterFeatureFactory must load first, it initialises the feature class chain
import "../../../src/parser/features/CharacterFeatureFactory";
import DDBFeatureMixin from "../../../src/parser/features/DDBFeatureMixin";

/** Replicates the exact template literal used by buildFullDescription. */
function detailsBlock(summary: string, main: string, title = "More Details"): string {
  return `${summary}<br>
  <details>
    <summary>
      ${title}
    </summary>
    <p>
      ${main}
    </p>
  </details>`;
}

describe("DDBFeatureMixin.buildFullDescription", () => {
  beforeAll(() => {
    // utils.stringKindaEqual strips html via document.createElement, which the
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

  it("returns the trimmed main text when there is no summary", () => {
    expect(DDBFeatureMixin.buildFullDescription("  <p>Main text.</p>  ", null)).toBe("<p>Main text.</p>");
  });

  it("returns the trimmed main text when the summary is an empty string", () => {
    expect(DDBFeatureMixin.buildFullDescription("<p>Main text.</p>", "")).toBe("<p>Main text.</p>");
  });

  it("wraps a distinct summary and main into a details block with the default title", () => {
    const result = DDBFeatureMixin.buildFullDescription("<p>Long form.</p>", "Short form.");
    expect(result).toBe(detailsBlock("Short form.", "<p>Long form.</p>"));
  });

  it("uses a custom title when provided", () => {
    const result = DDBFeatureMixin.buildFullDescription("<p>Long form.</p>", "Short form.", "Full Text");
    expect(result).toBe(detailsBlock("Short form.", "<p>Long form.</p>", "Full Text"));
  });

  it("returns only the main text when summary and main are kinda equal", () => {
    expect(DDBFeatureMixin.buildFullDescription("Same text.", "Same text.")).toBe("Same text.");
  });

  it("treats html markup and whitespace as equal when comparing summary and main", () => {
    // stringKindaEqual strips html and collapses whitespace, so the summary is
    // dropped and the html main is returned untouched.
    const result = DDBFeatureMixin.buildFullDescription("<p>Hello   World</p>", "Hello World");
    expect(result).toBe("<p>Hello   World</p>");
  });

  it("returns the trimmed summary when the main text is empty", () => {
    expect(DDBFeatureMixin.buildFullDescription("", "  Snippet only.  ")).toBe("Snippet only.");
    expect(DDBFeatureMixin.buildFullDescription("   ", "Snippet only.")).toBe("Snippet only.");
  });

  it("returns an empty string when both are empty", () => {
    expect(DDBFeatureMixin.buildFullDescription("", null)).toBe("");
    expect(DDBFeatureMixin.buildFullDescription("  ", "")).toBe("");
  });

  it("ignores a whitespace-only summary when the main has content", () => {
    expect(DDBFeatureMixin.buildFullDescription("<p>Main.</p>", "   ")).toBe("<p>Main.</p>");
  });
});

describe("DDBFeatureMixin.getFeatureSubtype", () => {
  describe("class feature exact names", () => {
    it("classifies core option holders", () => {
      expect(DDBFeatureMixin.getFeatureSubtype("Ki", "class")).toBe("ki");
      expect(DDBFeatureMixin.getFeatureSubtype("Channel Divinity", "class")).toBe("channelDivinity");
      expect(DDBFeatureMixin.getFeatureSubtype("Artificer Infusion", "class")).toBe("artificerInfusion");
      expect(DDBFeatureMixin.getFeatureSubtype("Invocation", "class")).toBe("eldritchInvocation");
      expect(DDBFeatureMixin.getFeatureSubtype("Eldritch Invocations", "class")).toBe("eldritchInvocation");
      expect(DDBFeatureMixin.getFeatureSubtype("Metamagic", "class")).toBe("metamagic");
    });

    it("classifies fighting styles and maneuvers", () => {
      expect(DDBFeatureMixin.getFeatureSubtype("Fighting Style", "class")).toBe("fightingStyle");
      expect(DDBFeatureMixin.getFeatureSubtype("Additional Fighting Style", "class")).toBe("fightingStyle");
      expect(DDBFeatureMixin.getFeatureSubtype("Maneuver", "class")).toBe("maneuver");
      expect(DDBFeatureMixin.getFeatureSubtype("Maneuver Options", "class")).toBe("maneuver");
      expect(DDBFeatureMixin.getFeatureSubtype("Battle Master Maneuver", "class")).toBe("maneuver");
    });

    it("classifies warlock pacts via startsWith even in the exact block", () => {
      expect(DDBFeatureMixin.getFeatureSubtype("Pact of the Blade", "class")).toBe("pact");
      expect(DDBFeatureMixin.getFeatureSubtype("Pact Boon", "class")).toBe("pact");
      // startsWith rules live in the non-partial section, so they apply even
      // when includePartial is false
      expect(DDBFeatureMixin.getFeatureSubtype("Pact of the Chain", "class", false)).toBe("pact");
    });

    it("classifies the remaining exact class names", () => {
      expect(DDBFeatureMixin.getFeatureSubtype("Rune Carver", "class")).toBe("rune");
      expect(DDBFeatureMixin.getFeatureSubtype("Psionic Power", "class")).toBe("psionicPower");
      expect(DDBFeatureMixin.getFeatureSubtype("Hunter's Prey", "class")).toBe("huntersPrey");
      expect(DDBFeatureMixin.getFeatureSubtype("Defensive Tactics", "class")).toBe("defensiveTactic");
      expect(DDBFeatureMixin.getFeatureSubtype("Superior Hunter's Defense", "class")).toBe("superiorHuntersDefense");
      expect(DDBFeatureMixin.getFeatureSubtype("Arcane Shot Options", "class")).toBe("arcaneShot");
      expect(DDBFeatureMixin.getFeatureSubtype("Elemental Disciplines", "class")).toBe("elementalDiscipline");
    });
  });

  describe("class feature partial names", () => {
    it("classifies prefixed option names", () => {
      expect(DDBFeatureMixin.getFeatureSubtype("Ki: Flurry of Blows", "class")).toBe("ki");
      expect(DDBFeatureMixin.getFeatureSubtype("Channel Divinity: Turn Undead", "class")).toBe("channelDivinity");
      expect(DDBFeatureMixin.getFeatureSubtype("Artificer Infusion: Enhanced Weapon", "class")).toBe("artificerInfusion");
      expect(DDBFeatureMixin.getFeatureSubtype("Invocation: Agonizing Blast", "class")).toBe("eldritchInvocation");
      expect(DDBFeatureMixin.getFeatureSubtype("Fighting Style: Defense", "class")).toBe("fightingStyle");
      expect(DDBFeatureMixin.getFeatureSubtype("Rune Carver: Cloud Rune", "class")).toBe("rune");
      expect(DDBFeatureMixin.getFeatureSubtype("Psionic Power: Psionic Strike", "class")).toBe("psionicPower");
    });

    it("classifies all three maneuver prefixes", () => {
      expect(DDBFeatureMixin.getFeatureSubtype("Maneuver: Riposte", "class")).toBe("maneuver");
      expect(DDBFeatureMixin.getFeatureSubtype("Maneuvers: Parry", "class")).toBe("maneuver");
      expect(DDBFeatureMixin.getFeatureSubtype("Battle Master Maneuver: Trip Attack", "class")).toBe("maneuver");
    });

    it("classifies both metamagic prefix spellings", () => {
      expect(DDBFeatureMixin.getFeatureSubtype("Metamagic: Careful Spell", "class")).toBe("metamagic");
      expect(DDBFeatureMixin.getFeatureSubtype("Metamagic - Twinned Spell", "class")).toBe("metamagic");
    });

    it("returns null for prefixed names when includePartial is false", () => {
      expect(DDBFeatureMixin.getFeatureSubtype("Ki: Flurry of Blows", "class", false)).toBeNull();
      expect(DDBFeatureMixin.getFeatureSubtype("Metamagic: Careful Spell", "class", false)).toBeNull();
      expect(DDBFeatureMixin.getFeatureSubtype("Maneuver: Riposte", "class", false)).toBeNull();
    });

    it("matches Channel Divinity by prefix without a colon", () => {
      expect(DDBFeatureMixin.getFeatureSubtype("Channel Divinity (Harness Divine Power)", "class")).toBe("channelDivinity");
    });
  });

  describe("feat categories", () => {
    const cat = (tagName: string): any => ({ tagName });

    it("classifies feats by category tag", () => {
      expect(DDBFeatureMixin.getFeatureSubtype("Alert", "feat", true, [cat("Origin")])).toBe("origin");
      expect(DDBFeatureMixin.getFeatureSubtype("Archery", "feat", true, [cat("Fighting Style")])).toBe("fightingStyle");
      expect(DDBFeatureMixin.getFeatureSubtype("Boon of Combat Prowess", "feat", true, [cat("Epic Boon")])).toBe("epicBoon");
      expect(DDBFeatureMixin.getFeatureSubtype("Mark of Making", "feat", true, [cat("Dragonmark")])).toBe("dragonmark");
      expect(DDBFeatureMixin.getFeatureSubtype("Gift of Vampirism", "feat", true, [cat("Dark Gift")])).toBe("darkGift");
      expect(DDBFeatureMixin.getFeatureSubtype("Tough", "feat", true, [cat("General")])).toBe("general");
    });

    it("uses the first matching tag in priority order", () => {
      const categories = [cat("General"), cat("Origin")];
      expect(DDBFeatureMixin.getFeatureSubtype("Alert", "feat", true, categories)).toBe("origin");
    });

    it("falls back to dragonmark name heuristics when no tag matches", () => {
      expect(DDBFeatureMixin.getFeatureSubtype("Mark of Warding", "feat", true, [cat("Unknown")])).toBe("dragonmark");
      expect(DDBFeatureMixin.getFeatureSubtype("Greater Mark of Storm", "feat", true, [cat("Unknown")])).toBe("dragonmark");
      expect(DDBFeatureMixin.getFeatureSubtype("Aberrant Dragonmark", "feat", true, [cat("Unknown")])).toBe("dragonmark");
      expect(DDBFeatureMixin.getFeatureSubtype("Greater Aberrant Mark Boon", "feat", true, [cat("Unknown")])).toBe("dragonmark");
    });

    it("defaults to general for unknown feat categories", () => {
      expect(DDBFeatureMixin.getFeatureSubtype("Mystery Feat", "feat", true, [cat("Unknown")])).toBe("general");
      expect(DDBFeatureMixin.getFeatureSubtype("Mystery Feat", "feat", true, [])).toBe("general");
    });

    it("returns null for feats without categories", () => {
      expect(DDBFeatureMixin.getFeatureSubtype("Tough", "feat")).toBeNull();
      expect(DDBFeatureMixin.getFeatureSubtype("Tough", "feat", true, null)).toBeNull();
    });
  });

  describe("non matches", () => {
    it("returns null for unclassified class features", () => {
      expect(DDBFeatureMixin.getFeatureSubtype("Sneak Attack", "class")).toBeNull();
      expect(DDBFeatureMixin.getFeatureSubtype("Rage", "class")).toBeNull();
    });

    it("returns null for race and background types", () => {
      expect(DDBFeatureMixin.getFeatureSubtype("Darkvision", "race")).toBeNull();
      expect(DDBFeatureMixin.getFeatureSubtype("Ki", "race")).toBeNull();
      expect(DDBFeatureMixin.getFeatureSubtype("Ki", "background")).toBeNull();
    });
  });
});
