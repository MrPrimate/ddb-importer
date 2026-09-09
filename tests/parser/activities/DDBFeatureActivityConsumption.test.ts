// Characterization tests for the description-text consumption sniffing in
// DDBFeatureActivity: the pattern table that turns "spend 2 ki points" style
// phrases into consumption targets, and the word-number parsing behind it.

// CharacterFeatureFactory must load first, it initialises the feature class chain
import "../../../src/parser/features/CharacterFeatureFactory";
import { CONSUMPTION_PATTERNS, parseConsumptionValue } from "../../../src/parser/activities/DDBFeatureActivity";

interface IMatchResult {
  target: string;
  value: number;
  type: "itemUses" | "hitDice";
}

// mirrors the first-match-wins loop in _generateConsumption
function sniff(description: string): IMatchResult | null {
  for (const pattern of CONSUMPTION_PATTERNS) {
    const match = pattern.regex.exec(description);
    if (match) {
      return {
        target: typeof pattern.target === "string" ? pattern.target : pattern.target(match),
        value: parseConsumptionValue(match[1]) ?? 1,
        type: pattern.type ?? "itemUses",
      };
    }
  }
  return null;
}

describe("parseConsumptionValue", () => {
  it.each([
    ["2", 2],
    ["12", 12],
    ["one", 1],
    ["two", 2],
    ["four", 4],
    ["a", 1],
    ["an", 1],
    ["Three", 3],
  ] as [string, number][])("parses %s as %d", (raw, expected) => {
    expect(parseConsumptionValue(raw)).toBe(expected);
  });

  it("returns null for unparseable words and empty input", () => {
    expect(parseConsumptionValue("additional")).toBeNull();
    expect(parseConsumptionValue("")).toBeNull();
    expect(parseConsumptionValue(undefined)).toBeNull();
  });
});

describe("CONSUMPTION_PATTERNS", () => {
  // phrases lifted from real DDB feature text seen in the audit fixtures
  it.each([
    ["spend 2 ki points to cancel the disadvantage", "ki", 2],
    ["expend 1 Ki Point to use your Step of the Wind", "ki", 1],
    ["spend 2 Focus points to cancel the disadvantage", "monks-focus", 2],
    ["expend 3 Focus Points to bolster yourself", "monks-focus", 3],
    ["spend 1 sorcery point to gain resistance", "sorcery-points", 1],
    ["expend two Sorcery Points as a Bonus Action", "sorcery-points", 2],
    ["expend one Risk Die to draw a Ranged weapon", "risk", 1],
    ["expend 2 Blood Points to cast the Black Tentacles spell", "blood-potency", 2],
    ["expend 1 Blood Point to grow rending claws", "blood-potency", 1],
    ["spend 3 wick points to ignite a 10-foot length", "wick-points", 3],
    ["expend 1 grit point to gain advantage on the attack roll", "grit-points", 1],
    ["expend one grit point to attempt to trip them up", "grit-points", 1],
    ["spend 5 maneuver points to attempt to sunder your enemy", "maneuver-points", 5],
    ["spend 2 or more maneuver points to use the resilient parts", "maneuver-points", 2],
    ["expend 1 Moxie Point to reduce the damage dealt to you", "moxie", 1],
    ["expend a seal to end one of the following conditions", "baleful-interdict", 1],
    ["expend four seals to attempt to send that creature to Hell", "baleful-interdict", 4],
    ["expend one or more seals to attempt to bind your awareness", "baleful-interdict", 1],
    ["expend one use of your Bardic Inspiration to grant yourself", "bardic-inspiration", 1],
    ["expend a Bardic Inspiration die to exhale flames", "bardic-inspiration", 1],
    ["expend one use of Bardic Inspiration, roll the die", "bardic-inspiration", 1],
    ["expend a use of your Channel Divinity to evoke healing energy", "channel-divinity", 1],
    ["expend one Superiority Die to bolster the resolve of a companion", "superiority-dice", 1],
    ["expend a use of your Wild Shape to manifest a 5-foot Emanation", "wild-shape", 1],
    ["expend a use of your Second Wind to push yourself toward success", "second-wind", 1],
    ["expend a use of Favored Enemy to transform into a ghastly form", "favored-enemy", 1],
  ] as [string, string, number][])("\"%s\" -> %s x%d", (text, target, value) => {
    const result = sniff(text);
    expect(result).not.toBeNull();
    expect(result!.type).toBe("itemUses");
    expect(result!.target).toBe(target);
    expect(result!.value).toBe(value);
  });

  it.each([
    ["spend one Hit Die to heal yourself", 1],
    ["expend one of your Hit Dice and roll it", 1],
    ["spend one or more Hit Dice to regain hit points", 1],
    ["spend a Hit Point Die or a Sangromancy Die, roll the die", 1],
    ["expend one of its Hit Point Dice, roll the die", 1],
  ] as [string, number][])("\"%s\" -> hitDice consumption", (text, value) => {
    const result = sniff(text);
    expect(result).not.toBeNull();
    expect(result!.type).toBe("hitDice");
    expect(result!.target).toBe("largest");
    expect(result!.value).toBe(value);
  });

  it("ignores text without a recognised spend phrase", () => {
    expect(sniff("You gain a bonus to your AC while wielding a shield.")).toBeNull();
    // spell slots stay enricher territory: level scaling cannot be inferred
    expect(sniff("expend a spell slot to deal an extra 1d8 Necrotic damage")).toBeNull();
    // similar words must not trip the boundary-anchored patterns
    expect(sniff("your sealed fate is pointless")).toBeNull();
  });

  it("keeps module-level regexes stateless across matches", () => {
    // a g-flagged regex would advance lastIndex and miss on the second call
    expect(sniff("spend 2 ki points to do a thing")).not.toBeNull();
    expect(sniff("spend 2 ki points to do a thing")).not.toBeNull();
  });
});
