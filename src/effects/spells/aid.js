import DDBMacros from "../macros.js";
import { baseSpellEffect } from "../specialSpells.js";

export async function aidEffect(document) {
  let effect = baseSpellEffect(document, document.name);
  effect.changes.push({
    key: "system.attributes.hp.tempmax",
    value: "5 * (@spellLevel - 1)",
    mode: CONST.ACTIVE_EFFECT_MODES.ADD,
    priority: 20,
  });
  await DDBMacros.setItemMacroFlag(document, "spell", "aid.js");
  effect.changes.push(DDBMacros.generateMacroChange({ macroValues: "@spellLevel", macroType: "spell", macroName: "aid.js", priority: 0 }));
  document.effects.push(effect);
  document.system.damage = { parts: [], versatile: "", value: "" };

  return document;
}
