import { baseSpellEffect } from "../specialSpells.js";
import DDBMacros from "../macros.js";

export async function eyebiteEffect(document) {
  let effect = baseSpellEffect(document, document.name);
  await DDBMacros.setItemMacroFlag(document, "spell", "eyebite.js");
  effect.flags.dae.macroRepeat = "startEveryTurn";
  effect.changes.push(DDBMacros.generateMacroChange({ macroType: "spell", macroName: "eyebite.js" }));
  document.effects.push(effect);
  setProperty(document, "system.actionType", "other");
  setProperty(document, "system.save.ability", "");

  return document;
}
