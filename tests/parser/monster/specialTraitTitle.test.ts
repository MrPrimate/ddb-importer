// @vitest-environment jsdom
vi.mock("../../../src/parser/monster/features/DDBMonsterFeature", () => ({
  default: class DDBMonsterFeature {},
}));

import DDBMonsterFeatureFactory from "../../../src/parser/monster/features/DDBMonsterFeatureFactory";

function emphasis(html: string): Element {
  const holder = document.createElement("div");
  holder.innerHTML = html;
  const node = holder.querySelector("em");
  if (!node) throw new Error("no emphasis in fixture");
  return node;
}

describe("DDBMonsterFeatureFactory.specialTraitTitle", () => {
  it("takes the strong title when the emphasis also wraps a 2024 save label", () => {
    const node = emphasis("<p><em><strong>Test Aura.</strong> Wisdom Saving Throw:</em> DC 20, any enemy.</p>");
    expect(DDBMonsterFeatureFactory.specialTraitTitle(node).textContent).toBe("Test Aura.");
  });

  it("keeps the whole emphasis for an ordinary title, recharge text included", () => {
    const plain = emphasis("<p><em><strong>Test Trait.</strong></em> The thing does a thing.</p>");
    expect(DDBMonsterFeatureFactory.specialTraitTitle(plain)).toBe(plain);
    const recharge = emphasis("<p><em><strong>Test Burst</strong> (Recharge 5-6).</em> Boom.</p>");
    expect(DDBMonsterFeatureFactory.specialTraitTitle(recharge)).toBe(recharge);
  });

  it("falls back to the emphasis when a save label has no strong title inside it", () => {
    const node = emphasis("<p><em>Wisdom Saving Throw:</em> DC 12.</p>");
    expect(DDBMonsterFeatureFactory.specialTraitTitle(node)).toBe(node);
  });
});
