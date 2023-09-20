import { baseItemEffect } from "../effects.js";
import DDBMacros from "../macros.js";

export async function cloakOfDisplacementEffect(document) {
  let effect = baseItemEffect(document, `${document.name} - Check`);
  setProperty(effect, "flags.dae.macroRepeat", "startEveryTurn");
  const itemMacroText = await DDBMacros.loadMacroFile("item", "cloakOfDisplacement.js");
  document = DDBMacros.generateItemMacroFlag(document, itemMacroText);
  effect.changes.push(DDBMacros.generateMacroChange({ macroType: "item", macroName: "cloakOfDisplacement.js" }));
  document.effects[0] = effect;

  // setProperty(document.effects[0], "flags.dae.specialDuration", ["isDamaged"]);

  return document;
}
