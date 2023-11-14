import { baseSpellEffect } from "../specialSpells.js";
import DDBMacros from "../DDBMacros.js";
import { effectModules } from "../effects.js";

export async function enlargeReduceEffect(document) {
  if (!effectModules().atlInstalled) return document;

  let effect = baseSpellEffect(document, document.name);
  await DDBMacros.setItemMacroFlag(document, "spell", "enlargeReduce.js");
  effect.changes.push(DDBMacros.generateMacroChange({ macroType: "spell", macroName: "enlargeReduce.js", priority: 0 }));
  document.effects.push(effect);

  return document;
}
