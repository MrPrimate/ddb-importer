import { baseSpellEffect } from "../specialSpells.js";
import DDBMacros from "../macros.js";

export async function witchBoltEffect(document) {
  let effect = baseSpellEffect(document, document.name);

  const itemMacroText = await DDBMacros.loadMacroFile("spell", "witchBolt.js");
  document = DDBMacros.generateItemMacroFlag(document, itemMacroText);
  DDBMacros.setMidiOnUseMacroFlag(document, "spell", "witchBolt.js", ["postActiveEffects"]);
  document.effects.push(effect);

  return document;
}
