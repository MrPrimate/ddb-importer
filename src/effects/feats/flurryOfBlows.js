import { DDBMacros } from "../../lib/_module.mjs";

export async function flurryOfBlowsEffect(document) {

  await DDBMacros.setItemMacroFlag(document, "feat", "flurryOfBlows.js");
  DDBMacros.setMidiOnUseMacroFlag(document, "feat", "flurryOfBlows.js", ["postActiveEffects"]);

  return document;
}
