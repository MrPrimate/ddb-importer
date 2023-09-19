import { baseItemEffect } from "../effects.js";
import { loadMacroFile, generateItemMacroFlag, generateOnUseMacroChange } from "../macros.js";

export async function arcaneWardEffect(document) {
  let detectionEffect = baseItemEffect(document, `${document.name}: Spell Detection`);
  const itemMacroText = await loadMacroFile("feat", "arcaneWard.js");
  document = generateItemMacroFlag(document, itemMacroText);

  detectionEffect.changes.push(
    generateOnUseMacroChange({ macroPass: "preActiveEffects", macroType: "spell", macroName: "arcaneWard.js", document }),
  );

  document.effects.push(detectionEffect);
  return document;
}
