import { DDBMacros } from "../../lib/_module.mjs";

export async function maskOfTheWildEffect(document) {
  await DDBMacros.setItemMacroFlag(document, "feat", "maskOfTheWild.js");
  DDBMacros.setMidiOnUseMacroFlag(document, "feat", "maskOfTheWild.js", ["postActiveEffects"]);

  return document;
}
