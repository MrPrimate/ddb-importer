import { baseSpellEffect } from "../specialSpells.js";
import DDBMacros from "../macros.js";

export async function eyebiteEffect(document) {
  let effect = baseSpellEffect(document, document.name);
  const itemMacroText = await DDBMacros.loadMacroFile("spell", "eyebite.js");
  document = DDBMacros.generateItemMacroFlag(document, itemMacroText);
  effect.flags.dae.macroRepeat = "startEveryTurn";
  effect.changes.push(DDBMacros.generateMacroChange(""));
  document.effects.push(effect);
  setProperty(document, "system.actionType", "other");
  setProperty(document, "system.save.ability", "");

  return document;
}
