import { baseSpellEffect } from "../specialSpells.js";
import DDBMacros from "../macros.js";

export async function rayofEnfeeblementEffect(document) {
  let effect = baseSpellEffect(document, document.name);
  effect.changes.push({
    key: "flags.midi-qol.OverTime",
    mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
    value: `label=${document.name} (End of Turn),turn=end,saveDC=@attributes.spelldc,saveAbility=con,savingThrow=true,saveMagic=true,killAnim=true`,
    priority: "20",
  });
  const itemMacroText = await DDBMacros.loadMacroFile("spell", "rayofEnfeeblement.js");
  document = DDBMacros.generateItemMacroFlag(document, itemMacroText);
  effect.changes.push(DDBMacros.generateMacroChange({ macroType: "spell", macroName: "rayofEnfeeblement.js" }));
  document.effects.push(effect);

  return document;
}
