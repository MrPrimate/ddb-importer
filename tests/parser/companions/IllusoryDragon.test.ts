import { illusoryDragonFeatureText } from "../../../src/parser/companions/types/IllusoryDragonText";

// Synthetic stand-ins for the two printings. Only the structural cues matter to the
// splitter: XGtE paragraphs carry class attributes, Arcana Unleashed wraps proper
// nouns in [lore] tags, and each feature paragraph names its save. The real spell
// text is exercised by tests/audit/illusoryDragonText.test.ts against the captured
// fixtures in the private submodule.
const LEGACY_STYLE = `<p class="Core-Styles_Core-Body">You shape a large shadow into a dragon in a space you can see.</p>
<p class="Core-Styles_Core-Body">When it appears, each foe that can see it must succeed on a Wisdom saving throw or be frightened for 1 minute.</p>
<p class="Core-Styles_Core-Body">As a bonus action you may move it 60 feet and have it breathe in a 60-foot cone; each creature there makes an Intelligence saving throw, taking 7d6 damage on a failure.</p>
<p class="Core-Styles_Core-Body">A creature that studies it can tell it is a fake with an Intelligence (Investigation) check.</p>`;

const MODERN_STYLE = `<p>You shape a shadow from the [lore]Gloaming[/lore] into a dragon in a space you can see.</p>
<p>When it appears, each foe that can see it makes a Wisdom saving throw, gaining the Frightened condition on a failure.</p>
<p>As a Bonus Action you may move it 60 feet and have it breathe in a 60-foot Cone; each creature there makes an Intelligence saving throw, taking 6d6 Acid or Cold damage on a failure.</p>
<p>A creature that takes the Study action can tell it is a fake with an Intelligence (Investigation) check.</p>`;

describe("illusoryDragonFeatureText", () => {
  it("splits the legacy-style printing into the fear, breath and illusion paragraphs", () => {
    const text = illusoryDragonFeatureText(LEGACY_STYLE);
    expect(text.fear).toMatch(/^When it appears, each foe/);
    expect(text.fear).toContain("Wisdom saving throw");
    expect(text.breath).toMatch(/^As a bonus action/);
    expect(text.breath).toContain("7d6 damage");
    expect(text.illusion).toMatch(/^A creature that studies it/);
    expect(text.illusion).toContain("Investigation");
    expect(text.fear).not.toContain("class=");
  });

  it("splits the modern-style printing and strips its lore tags", () => {
    const text = illusoryDragonFeatureText(MODERN_STYLE);
    expect(text.fear).toMatch(/^When it appears, each foe/);
    expect(text.breath).toContain("6d6 Acid or Cold damage");
    expect(text.illusion).toMatch(/^A creature that takes the Study action/);
    expect(`${text.fear}${text.breath}${text.illusion}`).not.toContain("[lore]");
  });

  it("returns empty strings when a paragraph is missing rather than guessing", () => {
    const text = illusoryDragonFeatureText("<p>Nothing to see here.</p>");
    expect(text).toEqual({ fear: "", breath: "", illusion: "" });
  });
});
