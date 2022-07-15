import { baseSpellEffect } from "../specialSpells.js";
import { loadMacroFile, generateMacroChange, generateItemMacroFlag } from "../macros.js";

export async function heroismEffect(document) {
  let effect = baseSpellEffect(document, document.name);
  effect.changes.push({
    key: "system.traits.ci.value",
    value: "frightened",
    mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM,
    priority: 20,
  });
  effect.flags.dae.macroRepeat = "startEveryTurn";
  const itemMacroText = await loadMacroFile("spell", "heroism.js");
  document.flags["itemacro"] = generateItemMacroFlag(document, itemMacroText);
  effect.changes.push(generateMacroChange("@damage", 0));
  document.effects.push(effect);

  return document;
}
