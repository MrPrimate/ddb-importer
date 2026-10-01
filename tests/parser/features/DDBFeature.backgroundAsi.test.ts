// @vitest-environment jsdom
/**
 * 2024 backgrounds outside the PHB often ship an empty primaryAbilities list; the ASI pseudo-feat's
 * template sentence is then the only place the three choosable abilities are named.
 */
// CharacterFeatureFactory must load first, it initialises the feature class chain
import "../../../src/parser/features/CharacterFeatureFactory";
import DDBFeature from "../../../src/parser/features/DDBFeature";

describe("DDBFeature.backgroundAsiAbilitiesFromText", () => {
  it("reads the three abilities from DDB's template sentence", () => {
    const html = "<p>The&nbsp;Test Background allows you to choose between Constitution, Intelligence, Wisdom. Increase one of these scores by 2 and another one by 1, or increase all three by 1. None of these increases can raise a score above 20.</p>";
    expect(DDBFeature.backgroundAsiAbilitiesFromText(html)).toEqual(["con", "int", "wis"]);
  });

  it("accepts an \"and\" before the last ability", () => {
    const html = "<p>The Test Background allows you to choose between Dexterity, Intelligence, and Charisma. Increase one of these scores by 2.</p>";
    expect(DDBFeature.backgroundAsiAbilitiesFromText(html)).toEqual(["dex", "int", "cha"]);
  });

  it("returns nothing for other wording, leaving the advancement unlocked", () => {
    expect(DDBFeature.backgroundAsiAbilitiesFromText("<p>Increase any ability score by 2.</p>")).toEqual([]);
    expect(DDBFeature.backgroundAsiAbilitiesFromText("<p>You may choose between Strength, Dexterity. Increase one.</p>")).toEqual([]);
  });
});
