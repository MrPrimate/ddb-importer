import { baseItemEffect } from "../effects.js";
import DDBMacros from "../DDBMacros.js";

export async function cloakOfDisplacementEffect(document) {
  let effect = baseItemEffect(document, `${document.name} - Check`);
  foundry.utils.setProperty(effect, "flags.dae.macroRepeat", "startEveryTurn");
  await DDBMacros.setItemMacroFlag(document, "item", "cloakOfDisplacement.js");
  effect.changes.push(DDBMacros.generateMacroChange({ macroType: "item", macroName: "cloakOfDisplacement.js" }));
  // eslint-disable-next-line require-atomic-updates
  document.effects[0] = effect;

  // foundry.utils.setProperty(document.effects[0], "flags.dae.specialDuration", ["isDamaged"]);

  return document;
}
