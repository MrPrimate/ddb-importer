import { baseSpellEffect } from "../specialSpells.js";
import DDBMacros from "../macros.js";

export async function moonbeamEffect(document) {
  let effect = baseSpellEffect(document, document.name);
  effect.flags.dae.macroRepeat = "startEveryTurn";
  const itemMacroText = await DDBMacros.loadMacroFile("spell", "moonbeam.js");
  document = DDBMacros.generateItemMacroFlag(document, itemMacroText);
  effect.changes.push(DDBMacros.generateMacroChange({ macroValues: "@spellLevel", macroType: "spell", macroName: "moonbeam.js" }));
  setProperty(effect, "flags.dae.selfTarget", true);
  setProperty(effect, "flags.dae.selfTargetAlways", true);
  document.effects.push(effect);
  document.system.damage = { parts: [], versatile: "", value: "" };
  document.system.actionType = "other";
  document.system.save.ability = "";

  return document;
}
