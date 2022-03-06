import { baseSpellEffect } from "../specialSpells.js";
import { loadMacroFile, generateMacroChange, generateItemMacroFlag } from "../macros.js";

export async function witchBoltEffect(document) {
  let effect = baseSpellEffect(document, document.name);

  const itemMacroText = await loadMacroFile("spell", "witchBolt.js");
  document.flags["itemacro"] = generateItemMacroFlag(document, itemMacroText);

  effect.changes.push(generateMacroChange("", 20, true));

  document.effects.push(effect);

  return document;
}
