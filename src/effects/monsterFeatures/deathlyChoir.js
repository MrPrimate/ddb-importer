import DDBMacros from "../macros.js";

export async function deathlyChoirEffect(document) {
  await DDBMacros.setItemMacroFlag(document, "monsterFeature", "deathlyChoir.js");
  DDBMacros.setMidiOnUseMacroFlag(document, "monsterFeature", "deathlyChoir.js", ["preambleComplete"]);

  setProperty(document, "system.target", { value: 10, width: null, units: "ft", type: "creature" });
  setProperty(document, "system.range", { value: null, long: null, units: "spec" });

  return document;
}
