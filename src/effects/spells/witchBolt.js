import { baseSpellEffect } from "../specialSpells.js";
import { loadMacroFile, generateItemMacroFlag } from "../macros.js";

export async function witchBoltEffect(document) {
  let effect = baseSpellEffect(document, document.name);

  const itemMacroText = await loadMacroFile("spell", "witchBolt.js");
  document.flags["itemacro"] = generateItemMacroFlag(document, itemMacroText);
  setProperty(document, "flags.midi-qol.onUseMacroName", "[postActiveEffects]ItemMacro");
  document.effects.push(effect);

  return document;
}
