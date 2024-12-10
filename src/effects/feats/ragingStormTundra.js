import { baseFeatEffect } from "../specialFeats.js";
import { DDBMacros } from "../../lib/_module.mjs";

export async function ragingStormTundraEffect(document) {
  const effect = baseFeatEffect(document, document.name);
  await DDBMacros.setItemMacroFlag(document, "feat", "ragingStormTundra.js");
  DDBMacros.setMidiOnUseMacroFlag(document, "feat", "ragingStormTundra.js", ["preTargeting"]);
  document.effects.push(effect);
  return document;
}
