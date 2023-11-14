import { baseSpellEffect } from "../specialSpells.js";
import DDBMacros from "../DDBMacros.js";

export async function heroesFeastEffect(document) {
  let effect = baseSpellEffect(document, document.name);
  effect.changes.push(
    { key: "system.traits.di.value", value: "poison", mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM, priority: 20 },
    { key: "system.traits.ci.value", value: "frightened", mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM, priority: 20 }
  );
  await DDBMacros.setItemMacroFlag(document, "spell", "heroesFeast.js");
  effect.changes.push(DDBMacros.generateMacroChange({ macroValues: "@damage", macroType: "spell", macroName: "heroesFeast.js", priority: 0 }));
  document.effects.push(effect);

  return document;
}
