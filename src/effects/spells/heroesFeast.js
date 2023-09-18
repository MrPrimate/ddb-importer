import { baseSpellEffect } from "../specialSpells.js";
import { loadMacroFile, generateMacroChange, generateItemMacroFlag } from "../macros.js";

export async function heroesFeastEffect(document) {
  let effect = baseSpellEffect(document, document.name);
  effect.changes.push(
    { key: "system.traits.di.value", value: "poison", mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM, priority: 20 },
    { key: "system.traits.ci.value", value: "frightened", mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM, priority: 20 }
  );
  const itemMacroText = await loadMacroFile("spell", "heroesFeast.js");
  document = generateItemMacroFlag(document, itemMacroText);
  effect.changes.push(generateMacroChange("@damage", { priority: 0 }));
  document.effects.push(effect);

  return document;
}
