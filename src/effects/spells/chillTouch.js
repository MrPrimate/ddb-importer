import { baseSpellEffect } from "../specialSpells.js";
import { loadMacroFile, generateMacroChange, generateItemMacroFlag } from "../macros.js";

export async function chillTouchEffect(document) {
  let effect = baseSpellEffect(document, document.name);
  effect.changes.push({
    key: "data.traits.di.value",
    mode: CONST.ACTIVE_EFFECT_MODES.ADD,
    value: "healing",
    priority: "30",
  });
  const itemMacroText = await loadMacroFile("spell", "chillTouch.js");
  document.flags["itemacro"] = generateItemMacroFlag(document, itemMacroText);
  effect.changes.push(generateMacroChange(""));
  document.effects.push(effect);

  return document;
}
