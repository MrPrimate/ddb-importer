import { DDBMacros } from "../../lib/_module.mjs";

export async function stormAuraTundraEffect(document) {
  await DDBMacros.setItemMacroFlag(document, "feat", "stormAuraTundra.js");
  DDBMacros.setMidiOnUseMacroFlag(document, "feat", "stormAuraTundra.js", ["postActiveEffects"]);
  return document;
}
