import { baseSpellEffect } from "../specialSpells.js";
import DDBMacros from "../DDBMacros.mjs";
import { effectModules } from "../effects.js";

export async function enlargeReduceEffect(document) {

  // const macroToggle = `<br><p>[[/ddbifunc functionName="enlargeReduce" functionType="spell"]]{Enlarge/Reduce Toggle}</div></p>`;
  // document.system.description.value += macroToggle;
  // if (document.system.description.chat !== "") document.system.description.chat += macroToggle;

  if (!effectModules().atlInstalled) return document;

  let effect = baseSpellEffect(document, document.name);
  await DDBMacros.setItemMacroFlag(document, "spell", "enlargeReduce.js");
  effect.changes.push(DDBMacros.generateMacroChange({ macroType: "spell", macroName: "enlargeReduce.js", priority: 0 }));
  document.effects.push(effect);

  return document;
}
