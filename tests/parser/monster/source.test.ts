import "../../../src/parser/DDBMonster";
import { resolveMonsterSource } from "../../../src/parser/monster/source";
import { setMockSettings } from "../../_setup/foundryMocks";

describe("resolveMonsterSource rules version", () => {
  afterEach(() => {
    setMockSettings({ rulesVersion: "modern" }, "dnd5e");
  });

  it.each([
    ["modern", false],
    ["legacy", true],
  ] as const)("files bookless homebrew under the %s system rules", (systemRules, is2014) => {
    setMockSettings({ rulesVersion: systemRules }, "dnd5e");
    const resolved = resolveMonsterSource({ sourceId: 0, sources: [], sourcePageNumber: "", isHomebrew: true });
    expect(resolved.source.book).toBe("Homebrew");
    expect(resolved.is2014).toBe(is2014);
  });

  it("keeps legacy-flagged homebrew on 2014", () => {
    setMockSettings({ rulesVersion: "modern" }, "dnd5e");
    expect(resolveMonsterSource({ sourceId: 0, sources: [], sourcePageNumber: "", isHomebrew: true, isLegacy: true }).is2014)
      .toBe(true);
  });

  it("leaves homebrew that names a DDB book, and bookless official monsters, to the source ids", () => {
    setMockSettings({ rulesVersion: "modern" }, "dnd5e");
    expect(resolveMonsterSource({ sourceId: 5, sources: [], sourcePageNumber: "", isHomebrew: true }).is2014).toBe(true);
    expect(resolveMonsterSource({ sourceId: 0, sources: [], sourcePageNumber: "" }).is2014).toBe(true);
  });
});
