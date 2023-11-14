import { baseSpellEffect } from "../specialSpells.js";
import DDBMacros from "../DDBMacros.js";

export async function rayofEnfeeblementEffect(document) {
  let effect = baseSpellEffect(document, document.name);
  effect.changes.push({
    key: "flags.midi-qol.OverTime",
    mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
    value: `label=${document.name} (End of Turn),turn=end,saveDC=@attributes.spelldc,saveAbility=con,savingThrow=true,saveMagic=true,killAnim=true`,
    priority: "20",
  });
  await DDBMacros.setItemMacroFlag(document, "spell", "rayofEnfeeblement.js");
  effect.changes.push(DDBMacros.generateMacroChange({ macroType: "spell", macroName: "rayofEnfeeblement.js" }));
  document.effects.push(effect);

  return document;
}
