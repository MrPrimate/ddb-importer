import { baseSpellEffect } from "../specialSpells.js";
import DDBMacros from "../DDBMacros.js";

// this one is a bit different, the macro is triggered by midi-qol and applies effects to the actor
// the Marked effect gets applied to the target
export async function hexEffect(document) {
  let effect = baseSpellEffect(document, "Marked");

  await DDBMacros.setItemMacroFlag(document, "spell", "hex.js");
  DDBMacros.setMidiOnUseMacroFlag(document, "spell", "hex.js", ["postActiveEffects"]);
  foundry.utils.setProperty(document, "system.actionType", "util");

  document.effects.push(effect);
  return document;
}
