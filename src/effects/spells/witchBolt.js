import { baseSpellEffect } from "../specialSpells.js";
import { loadMacroFile, generateItemMacroFlag, setMidiOnUseMacroFlag } from "../macros.js";

export async function witchBoltEffect(document) {
  let effect = baseSpellEffect(document, document.name);

  const itemMacroText = await loadMacroFile("spell", "witchBolt.js");
  document = generateItemMacroFlag(document, itemMacroText);
  setMidiOnUseMacroFlag(document, "spell", "witchBolt.js", ["postActiveEffects"]);
  document.effects.push(effect);

  return document;
}
