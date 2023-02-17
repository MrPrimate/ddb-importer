import { baseItemEffect } from "../effects.js";
import { loadMacroFile, generateItemMacroFlag } from "../macros.js";

export async function arcaneWardEffect(document) {
  let detectionEffect = baseItemEffect(document, `${document.name}: Spell Detection`);
  const itemMacroText = await loadMacroFile("feat", "arcaneWard.js");
  document.flags["itemacro"] = generateItemMacroFlag(document, itemMacroText);

  detectionEffect.changes.push({
    key: "flags.midi-qol.onUseMacroName",
    value: `ItemMacro.${document.name}, preActiveEffects`,
    mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM,
    priority: "20",
  });

  document.effects.push(detectionEffect);
  return document;
}
