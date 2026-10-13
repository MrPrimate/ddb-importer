// @vitest-environment jsdom
/**
 * The activation a feature's text states. 2024 class features say "As a Magic action", "take a
 * Reaction" or "take a Bonus Action", which the 2014-only reader missed, so Cutting Words,
 * Preserve Life and the Battle Master manoeuvres imported with no activation.
 */
import "../../../src/parser/features/CharacterFeatureFactory";
import DDBFeatureMixin from "../../../src/parser/features/DDBFeatureMixin";

function parsed(description: string | null, snippet: string | null = null) {
  const stub = Object.assign(Object.create(DDBFeatureMixin.prototype) as DDBFeatureMixin, {
    ddbDefinition: { description, snippet },
  });
  return stub.getParsedActionType();
}

describe("DDBFeatureMixin.prototype.getParsedActionType", () => {
  it.each([
    ["2014 as an action", "<p>As an action, you can expend one spell slot to fuel your magic.</p>", "action"],
    ["2014 use your reaction", "<p>When a creature you can see hits you, you can use your reaction to halve the damage.</p>", "reaction"],
    ["2014 spend a bonus action", "<p>You can spend a bonus action to enter a rage.</p>", "bonus"],
    ["2024 Magic action", "<p>As a Magic action, you present your Holy Symbol and expend a use of your Channel Divinity.</p>", "action"],
    ["2024 take a Reaction", "<p>When a creature succeeds on an attack roll, you can take a Reaction to expend one use of your Bardic Inspiration.</p>", "reaction"],
    ["2024 take a Bonus Action", "<p>As a Bonus Action, you can expend one Superiority Die and take the Disengage action.</p>", "bonus"],
    ["2024 Utilize action", "<p>You can take a Utilize action to open the vault.</p>", "action"],
    ["DDB action markup", "<p>As a [action]Magic[/action] action, you exert command over one Beast you can see within 30 feet of yourself.</p>", "action"],
    ["tags between the words", "<p>You can take a <strong>Reaction</strong> to impose Disadvantage on that roll.</p>", "reaction"],
  ])("reads %s", (_label, text, expected) => {
    expect(parsed(text)).toBe(expected);
  });

  it("takes the earliest mention when several kinds appear", () => {
    expect(parsed("<p>As a Bonus Action, you can attack; as an action you can instead command your familiar.</p>")).toBe("bonus");
    expect(parsed("<p>You can use your action to mark a creature. On your later turns you can take a Bonus Action to move it.</p>")).toBe("action");
  });

  it("ignores wording that only mentions the economy", () => {
    expect(parsed("<p>While raging you can't take reactions, and the Disengage action costs you nothing.</p>")).toBeUndefined();
    expect(parsed("<p>Your speed increases by 10 feet.</p>")).toBeUndefined();
  });

  it("falls back to the snippet and reads nothing from an empty feature", () => {
    expect(parsed("", "You can take a Reaction to parry.")).toBe("reaction");
    expect(parsed(null, null)).toBeUndefined();
  });
});
