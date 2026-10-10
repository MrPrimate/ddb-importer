import { describe, expect, it } from "vitest";
import { splitMonsterBiography } from "../../../src/parser/monster/biographyText";

// synthetic text in the shape of a D&D Beyond monster page biography block
const intro = "<p>Test wyrms hoard spoons.</p>";
const lore = "<hr>\n<h3>Test Wyrms</h3>\n<p>They are fond of spoons.</p>";
const lair = "<h3>Test Wyrm Lairs</h3>\n<p>The region is warped:</p>\n<p><strong>Spoon Rain.</strong> It rains spoons.</p>";

describe("splitMonsterBiography", () => {
  it("keeps the whole block as the biography and takes the lair section with its heading", () => {
    const html = `${intro}\n${lore}\n<hr>\n${lair}\n`;
    const result = splitMonsterBiography(html);
    expect(result.biography).toBe(html.trim());
    expect(result.lair).toBe(lair);
  });

  it("stops the lair section at the next heading and drops trailing rules", () => {
    const html = `${intro}\n${lair}\n<hr>\n<h3>Test Wyrm Variants</h3>\n<p>Some have forks.</p>`;
    expect(splitMonsterBiography(html).lair).toBe(lair);
  });

  it("matches singular Lair headings and headings with markup", () => {
    const html = `${intro}\n<h3><span>Test Wyrm Lair</span></h3>\n<p>Lair text.</p>`;
    expect(splitMonsterBiography(html).lair).toBe("<h3><span>Test Wyrm Lair</span></h3>\n<p>Lair text.</p>");
  });

  it("returns no lair when there is no lair heading", () => {
    const html = `${intro}\n${lore}`;
    expect(splitMonsterBiography(html)).toEqual({ biography: html, lair: "" });
  });

  it("does not treat a heading that only mentions lairs as the lair section", () => {
    const html = `${intro}\n<h3>Lairs and Hoards of Test Wyrms</h3>\n<p>Text.</p>`;
    expect(splitMonsterBiography(html).lair).toBe("");
  });

  it("returns empty strings for an empty block", () => {
    expect(splitMonsterBiography("  \n ")).toEqual({ biography: "", lair: "" });
  });
});
