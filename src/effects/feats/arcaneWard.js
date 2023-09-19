import { baseItemEffect } from "../effects.js";
import DDBMacros from "../macros.js";

export async function arcaneWardEffect(document) {
  let detectionEffect = baseItemEffect(document, `${document.name}: Spell Detection`);
  const itemMacroText = await DDBMacros.loadMacroFile("feat", "arcaneWard.js");
  document = DDBMacros.generateItemMacroFlag(document, itemMacroText);

  detectionEffect.changes.push(
    DDBMacros.generateOnUseMacroChange({ macroPass: "preActiveEffects", macroType: "spell", macroName: "arcaneWard.js", document }),
  );

  document.effects.push(detectionEffect);
  return document;
}
