import { baseSpellEffect } from "../specialSpells.js";
import DDBMacros from "../DDBMacros.js";

export async function callLightningEffect(document) {
  let effect = baseSpellEffect(document, document.name);
  effect.changes.push(DDBMacros.generateMacroChange({ macroValues: "@spellLevel", macroType: "spell", macroName: "callLightning.js" }));
  foundry.utils.setProperty(effect, "flags.dae.selfTarget", true);
  foundry.utils.setProperty(effect, "flags.dae.selfTargetAlways", true);
  document.effects.push(effect);
  foundry.utils.setProperty(document, "system.actionType", "other");
  document.system.save.ability = "";
  await DDBMacros.setItemMacroFlag(document, "spell", "callLightning.js");
  DDBMacros.setMidiOnUseMacroFlag(document, "spell", "callLightning.js", ["preTargeting"]);

  return document;
}
