import { baseFeatEffect } from "../specialFeats.js";
import DDBMacros from "../macros.js";

export async function ancestralProtectorsEffect(document) {
  await DDBMacros.setItemMacroFlag(document, "feat", "ancestralProtectors.js");

  let effect = baseFeatEffect(document, document.name);
  effect.changes.push(
    DDBMacros.generateOnUseMacroChange({ macroPass: "postAttackRoll", macroType: "spell", macroName: "ancestralProtectors.js", document }),
  );


  effect.transfer = true;
  document.effects.push(effect);

  return document;
}
