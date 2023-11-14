import { baseSpellEffect } from "../specialSpells.js";
import DDBMacros from "../DDBMacros.js";

export async function witchBoltEffect(document) {
  let effect = baseSpellEffect(document, document.name);

  await DDBMacros.setItemMacroFlag(document, "spell", "witchBolt.js");
  DDBMacros.setMidiOnUseMacroFlag(document, "spell", "witchBolt.js", ["postActiveEffects"]);
  document.effects.push(effect);

  return document;
}
