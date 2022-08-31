import { loadMacroFile, generateMacroChange, generateItemMacroFlag } from "../macros.js";
import { baseSpellEffect } from "../specialSpells.js";

export async function aidEffect(document) {
  let effect = baseSpellEffect(document, document.name);
  effect.changes.push({
    key: "system.attributes.hp.max",
    value: "5 * (@spellLevel - 1)",
    mode: CONST.ACTIVE_EFFECT_MODES.ADD,
    priority: 20,
  });
  const itemMacroText = await loadMacroFile("spell", "aid.js");
  document.flags["itemacro"] = generateItemMacroFlag(document, itemMacroText);
  effect.changes.push(generateMacroChange("@spellLevel", 0));
  document.effects.push(effect);

  return document;
}
