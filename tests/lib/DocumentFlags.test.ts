import DocumentFlags from "../../src/lib/DocumentFlags";

/**
 * A re-import copies supported module flag groups from the existing document so sheet
 * customisations survive, but the keys the importer writes itself must come from the new parse.
 */
describe("DocumentFlags.copySupportedItemFlags", () => {
  it("keeps the user's tidy5e flags but takes the freshly parsed parentClass", () => {
    const original = { flags: { "tidy5e-sheet": { parentClass: "Warlock", section: "My Spells" } } } as any;
    const target = { flags: { "tidy5e-sheet": { parentClass: "warlock" } } } as any;
    DocumentFlags.copySupportedItemFlags(original, target);
    expect(target.flags["tidy5e-sheet"]).toEqual({ parentClass: "warlock", section: "My Spells" });
    // the existing document is not touched
    expect(original.flags["tidy5e-sheet"].parentClass).toBe("Warlock");
  });

  it("copies the whole group when the new parse has no value of its own", () => {
    const original = { flags: { "tidy5e-sheet": { parentClass: "Warlock" }, "midi-qol": { onUseMacroName: "x" } } } as any;
    const target = { flags: {} } as any;
    DocumentFlags.copySupportedItemFlags(original, target);
    expect(target.flags["tidy5e-sheet"]).toEqual({ parentClass: "Warlock" });
    expect(target.flags["midi-qol"]).toEqual({ onUseMacroName: "x" });
  });
});
