import { loadMacroFile, generateMacroChange, generateMacroFlags } from "../macros.js";
import { baseSpellEffect } from "../specialSpells.js";

export async function aidEffect(document) {
  let effect = baseSpellEffect(document, document.name);
  effect.changes.push({
    key: "data.attributes.hp.max",
    value: "5 * (@spellLevel - 1)",
    mode: CONST.ACTIVE_EFFECT_MODES.ADD,
    priority: 20,
  });
  // MACRO START
  const itemMacroText = await loadMacroFile("spell", "aid.js");
  // MACRO STOP
  document.flags["itemacro"] = generateMacroFlags(document, itemMacroText);
  effect.changes.push(generateMacroChange("@spellLevel", 0));
  document.effects.push(effect);

  return document;
}
