// @vitest-environment jsdom

import { parseTags, parseDamageRolls, parseToHitRoll } from "../../../src/parser/lib/DDBReferenceLinker";
import { setMockSettings } from "../../_setup/foundryMocks";

const globals: any = globalThis;

// The default mock setting value is the string "OFF", which is truthy, so
// loose SRD reference matching would silently run in every test. Make the
// switch explicit for each test instead.
function setLooseMatching(loose: boolean, superLoose = false): void {
  setMockSettings({
    "use-loose-srd-reference-matching": loose,
    "use-super-loose-srd-reference-matching": superLoose,
  });
}

// =============================================================================
// parseTags: rule/condition/skill style tags
// =============================================================================

describe("parseTags", () => {
  beforeEach(() => {
    setLooseMatching(false);
  });

  it("passes plain text through unchanged", () => {
    expect(parseTags("Nothing special here.")).toBe("Nothing special here.");
  });

  it("replaces a known rule tag with an enricher reference", () => {
    const result = parseTags("You have [rule]Advantage[/rule] on the roll.");
    expect(result).toBe("You have &Reference[advantage]{Advantage} on the roll.");
  });

  it("replaces multiple rule tags in one text", () => {
    const result = parseTags("Gain [rule]Advantage[/rule] or [rule]Disadvantage[/rule].");
    expect(result).toBe("Gain &Reference[advantage]{Advantage} or &Reference[disadvantage]{Disadvantage}.");
  });

  it("strips the tag but keeps the text for unknown rule slugs", () => {
    expect(parseTags("You are [rule]Fancypants[/rule] now.")).toBe("You are Fancypants now.");
  });

  it("strips condition tags when no condition lookup data exists", () => {
    // CONFIG.DND5E.conditionTypes is not stubbed, so conditions resolve to an
    // empty lookup and the tag decays to its plain text.
    expect(parseTags("You are [condition]Prone[/condition].")).toBe("You are Prone.");
  });

  it("strips skill tags when no skill lookup data exists", () => {
    expect(parseTags("Make an [skill]Acrobatics[/skill] check.")).toBe("Make an Acrobatics check.");
  });

  it("keeps the tag name when a compendium index is missing", () => {
    expect(parseTags("Cast [spell]Fireball[/spell] today.")).toBe("Cast Fireball today.");
  });

  describe("with a seeded spell compendium index", () => {
    beforeEach(() => {
      globals.CONFIG.DDBI.compendium = {
        index: {
          spell: [{
            _id: "abc123",
            name: "Fireball",
            uuid: "Compendium.world.ddb-spells.Item.abc123",
            system: { source: { rules: "2014" } },
            flags: { ddbimporter: { id: "999", originalName: "Fireball" } },
          }],
        },
        label: { spell: "world.ddb-spells" },
      };
    });

    afterEach(() => {
      delete globals.CONFIG.DDBI.compendium;
    });

    it("links spell tags via the compendium index", () => {
      const result = parseTags("Cast [spell]Fireball[/spell] today.");
      expect(result).toBe("Cast @Compendium[world.ddb-spells.abc123]{Fireball} today.");
    });

    it("links strong-wrapped spell names followed by the word spell", () => {
      const result = parseTags("as if using the <strong>fireball</strong> spell.");
      expect(result).toBe("as if using the @UUID[Compendium.world.ddb-spells.Item.abc123]{fireball} spell.");
    });

    it("links strong-wrapped spell names followed by a charge cost", () => {
      const result = parseTags("<strong>fireball</strong> (2 charges)");
      expect(result).toBe("@UUID[Compendium.world.ddb-spells.Item.abc123]{fireball} (2 charges)");
    });

    it("leaves unknown strong-wrapped spells alone", () => {
      const result = parseTags("the <strong>frostball</strong> spell");
      expect(result).toBe("the frostball spell");
    });
  });

  describe("loose SRD reference matching", () => {
    it("does not replace rule words when loose matching is off", () => {
      setLooseMatching(false);
      expect(parseTags("You have Advantage.")).toBe("You have Advantage.");
    });

    it("does not replace super-loose rule words in plain loose mode", () => {
      // "rules" is in the SUPER_LOOSE list, so plain loose matching skips it.
      setLooseMatching(true, false);
      expect(parseTags("You have Advantage.")).toBe("You have Advantage.");
    });

    it("replaces rule words in super loose mode", () => {
      setLooseMatching(true, true);
      expect(parseTags("You have Advantage.")).toBe("You have &Reference[advantage]{Advantage}.");
    });

    it("converts a DC + saving throw phrase into a save roll link in super loose mode", () => {
      setLooseMatching(true, true);
      const result = parseTags("make a DC 13 Grappling saving throw now");
      expect(result).toBe("make a [[/save grappling 13 format=long]] now");
    });
  });
});

// =============================================================================
// parseDamageRolls
// =============================================================================

describe("parseDamageRolls", () => {
  beforeEach(() => {
    setLooseMatching(false);
  });

  it("converts a parenthesised dice damage expression to a damage roll", () => {
    const text = "Melee Attack. Hit: 7 (2d6 + 4) slashing damage.";
    const result = parseDamageRolls({ text });
    expect(result).toContain("[[/damage 2d6 + 4 type=slashing average=true]]");
    expect(result).not.toContain("(2d6 + 4)");
  });

  it("converts multiple damage expressions", () => {
    const text = "Hit: 7 (2d6) fire damage plus 3 (1d6) cold damage.";
    const result = parseDamageRolls({ text });
    expect(result).toContain("[[/damage 2d6 type=fire average=true]]");
    expect(result).toContain("[[/damage 1d6 type=cold average=true]]");
  });

  it("leaves plain fixed damage without dice untouched", () => {
    // Characterization: the damage regex requires a dice expression, so fixed
    // "takes 5 fire damage" text never matches and is returned unchanged.
    const text = "The creature takes 5 fire damage.";
    expect(parseDamageRolls({ text })).toBe(text);
  });

  it("converts PB damage bonuses to @prof", () => {
    const text = "the target takes 1d8 + PB fire damage.";
    const result = parseDamageRolls({ text });
    expect(result).toContain("[[/damage 1d8 + @prof type=fire average=true]]");
  });

  it("converts spell level bonuses to @item.level", () => {
    const text = "the target takes 1d8 + the spell's level force damage.";
    const result = parseDamageRolls({ text });
    expect(result).toContain("[[/damage 1d8 + @item.level type=force average=true]]");
  });

  it("converts dice hit point regains to heal rolls", () => {
    // Characterization: Number.parseInt("3d6") === 3, so the dice regain hits
    // the "integer" fast path and gets average=false instead of going through
    // the dice roll generator (which would emit average=true).
    const text = "The troll regains 10 (3d6) hit points at the start of its turn.";
    const result = parseDamageRolls({ text });
    expect(result).toContain("[[/damage 3d6 type=heal average=false]]");
  });

  it("converts fixed hit point regains to flat heal rolls", () => {
    const text = "It regains 10 hit points when it eats.";
    const result = parseDamageRolls({ text });
    expect(result).toContain("[[/damage 10 type=heal average=false]] hit points");
  });

  it("handles multiple damage types joined with or", () => {
    const text = "Hit: 5 (1d10) bludgeoning or piercing damage.";
    const result = parseDamageRolls({ text });
    expect(result).toContain("type=bludgeoning/piercing");
  });
});

// =============================================================================
// parseToHitRoll
// =============================================================================

describe("parseToHitRoll", () => {
  const attackText = "<em>Melee Weapon Attack:</em> +5 to hit, reach 5 ft., one target.";

  it("returns text unchanged without a document", () => {
    expect(parseToHitRoll({ text: attackText })).toBe(attackText);
  });

  it("removes empty strong tags even without a document", () => {
    const result = parseToHitRoll({ text: "<strong></strong>hello" });
    expect(result).toBe("hello");
  });

  it("replaces a to-hit preamble with an extended attack enricher", () => {
    const result = parseToHitRoll({ text: attackText, document: {} as any });
    expect(result).toContain("[[/attack extended]]");
    expect(result).not.toContain("+5 to hit");
    expect(result).not.toContain("<em>");
  });

  it("handles ranged spell attacks", () => {
    const text = "<em>Ranged Spell Attack:</em> +7 to hit, range 120 ft., one target.";
    const result = parseToHitRoll({ text, document: {} as any });
    expect(result).toContain("[[/attack extended]]");
    expect(result).not.toContain("+7 to hit");
  });

  it("handles 2024 style attack roll wording", () => {
    const text = "<em>Melee Attack Roll:</em> +9, reach 10 ft.";
    const result = parseToHitRoll({ text, document: {} as any });
    expect(result).toContain("[[/attack extended]]");
  });

  it("ignores non-numeric to-hit bonuses", () => {
    const text = "Melee Weapon Attack: your spell attack modifier to hit, reach 5 ft.";
    expect(parseToHitRoll({ text, document: {} as any })).toBe(text);
  });

  it("ignores text without an attack preamble", () => {
    const text = "The creature bites for 1d6 damage.";
    expect(parseToHitRoll({ text, document: {} as any })).toBe(text);
  });
});
