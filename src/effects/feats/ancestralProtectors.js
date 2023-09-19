import { baseFeatEffect } from "../specialFeats.js";
import { loadMacroFile, generateItemMacroFlag, generateOnUseMacroChange } from "../macros.js";

export async function ancestralProtectorsEffect(document) {
  const itemMacroText = await loadMacroFile("feat", "ancestralProtectors.js");
  document = generateItemMacroFlag(document, itemMacroText);

  let effect = baseFeatEffect(document, document.name);
  effect.changes.push(
    generateOnUseMacroChange({ macroPass: "postAttackRoll", macroType: "spell", macroName: "ancestralProtectors.js", document }),
  );


  effect.transfer = true;
  document.effects.push(effect);

  return document;
}
