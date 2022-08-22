import { baseFeatEffect } from "../specialFeats.js";
import { loadMacroFile, generateItemMacroFlag } from "../macros.js";

export async function ancestralProtectorsEffect(document) {
  const itemMacroText = await loadMacroFile("feat", "ancestralProtectors.js");
  document.flags["itemacro"] = generateItemMacroFlag(document, itemMacroText);

  let effect = baseFeatEffect(document, document.name);
  effect.changes.push({
    key: "flags.midi-qol.onUseMacroName",
    value: "ItemMacro.Ancestral Protectors,postAttackRoll",
    mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM,
    priority: "20",
  });


  effect.transfer = true;
  document.effects.push(effect);

  return document;
}
