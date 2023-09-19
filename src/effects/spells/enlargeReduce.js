import { baseSpellEffect } from "../specialSpells.js";
import DDBMacros from "../macros.js";
import { effectModules } from "../effects.js";

export async function enlargeReduceEffect(document) {
  if (!effectModules().atlInstalled) return document;

  let effect = baseSpellEffect(document, document.name);
  const itemMacroText = await DDBMacros.loadMacroFile("spell", "enlargeReduce.js");
  document = DDBMacros.generateItemMacroFlag(document, itemMacroText);
  effect.changes.push(DDBMacros.generateMacroChange("", { priority: 0 }));
  document.effects.push(effect);

  return document;
}
