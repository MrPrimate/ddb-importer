import { baseSpellEffect } from "../specialSpells.js";
import DDBMacros from "../DDBMacros.js";

export async function moonbeamEffect(document) {
  let effect = baseSpellEffect(document, document.name);
  effect.flags.dae.macroRepeat = "startEveryTurn";
  await DDBMacros.setItemMacroFlag(document, "spell", "moonbeam.js");
  effect.changes.push(DDBMacros.generateMacroChange({ macroValues: "@spellLevel", macroType: "spell", macroName: "moonbeam.js" }));
  foundry.utils.setProperty(effect, "flags.dae.selfTarget", true);
  foundry.utils.setProperty(effect, "flags.dae.selfTargetAlways", true);
  document.effects.push(effect);
  document.system.damage = { parts: [], versatile: "", value: "" };
  document.system.actionType = "other";
  document.system.save.ability = "";

  return document;
}
