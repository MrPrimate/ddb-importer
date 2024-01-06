import { baseFeatEffect } from "../specialFeats.js";
import DDBMacros from "../DDBMacros.js";

export async function ancestralProtectorsEffect(document) {
  await DDBMacros.setItemMacroFlag(document, "feat", "ancestralProtectors.js");

  let effect = baseFeatEffect(document, document.name, { transfer: true });
  effect.changes.push(
    DDBMacros.generateOnUseMacroChange({ macroPass: "postAttackRoll", macroType: "spell", macroName: "ancestralProtectors.js", document }),
  );
  document.effects.push(effect);

  return document;
}
