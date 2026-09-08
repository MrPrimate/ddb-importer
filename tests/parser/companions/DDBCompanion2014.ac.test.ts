// @vitest-environment jsdom
import DDBCompanion2014 from "../../../src/parser/companions/DDBCompanion2014";

// jsdom does not implement innerText; the legacy parser reads rendered block text.
beforeAll(() => {
  Object.defineProperty(HTMLElement.prototype, "innerText", {
    configurable: true,
    get() {
      return this.textContent;
    },
  });
});

afterAll(() => {
  delete (HTMLElement.prototype as any).innerText;
});

function companion(subType?: string, html = `<strong>Armor Class</strong> 11 + the level of the spell (natural armor) + 2 (Defender only)`) {
  const block = document.createElement("div");
  block.innerHTML = `<p class="Stat-Block-Styles_Stat-Block-Data">${html}</p>`;
  const result = new DDBCompanion2014(block, { subType, rules: "2014" });
  result.npc = { system: { attributes: { ac: {} } } } as any;
  return result;
}

describe("legacy companion armor class", () => {
  it.each([["Avenger", 11], ["Defender", 13]])("gives %s its base AC and shared spell-level scaling", (subType, flat) => {
    const result = companion(subType as string);
    const ac = result.getBlockData("Armor Class");
    expect(ac).toBeDefined();
    result._handleAc(ac);
    expect(result.npc.system.attributes.ac).toMatchObject({ flat, calc: "natural" });
    expect(result.summons.bonuses.ac).toBe("@item.level");
  });

  it("still excludes an entire AC line restricted by its header", () => {
    const result = companion("Avenger", "<strong>Armor Class (Defender only)</strong> 13");
    expect(result.getBlockData("Armor Class")).toBeUndefined();
  });

  it("selects the matching form when separate AC headers exist", () => {
    const result = companion("Avenger", `<strong>Armor Class (Defender only)</strong> 13</p>
      <p class="Stat-Block-Styles_Stat-Block-Data"><strong>Armor Class (Avenger only)</strong> 11`);
    expect(result.getBlockData("Armor Class")).toBe("11");
  });

  it("parses ordinary AC without a form", () => {
    const result = companion(undefined, "<strong>Armor Class</strong> 12 (natural armor)");
    result._handleAc(result.getBlockData("Armor Class"));
    expect(result.npc.system.attributes.ac.flat).toBe(12);
    expect(result.summons.bonuses.ac).toBe("");
  });
});
