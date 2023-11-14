import { baseItemEffect } from "../effects.js";
import DDBMacros from "../DDBMacros.js";

export async function arcaneWardEffect(document) {
  let detectionEffect = baseItemEffect(document, `${document.name}: Spell Detection`);
  await DDBMacros.setItemMacroFlag(document, "feat", "arcaneWard.js");

  detectionEffect.changes.push(
    DDBMacros.generateOnUseMacroChange({ macroPass: "preActiveEffects", macroType: "spell", macroName: "arcaneWard.js", document }),
  );

  document.effects.push(detectionEffect);
  return document;
}
