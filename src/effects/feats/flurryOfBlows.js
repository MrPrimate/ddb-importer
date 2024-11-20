import DDBMacros from "../DDBMacros.mjs";

export async function flurryOfBlowsEffect(document) {

  await DDBMacros.setItemMacroFlag(document, "feat", "flurryOfBlows.js");
  DDBMacros.setMidiOnUseMacroFlag(document, "feat", "flurryOfBlows.js", ["postActiveEffects"]);

  return document;
}
