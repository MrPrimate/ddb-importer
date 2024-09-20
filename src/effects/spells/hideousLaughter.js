import DDBMacros from "../DDBMacros.js";
import { effectModules } from "../effects.js";

export async function hideousLaughterEffect(document) {

  if (effectModules().midiQolInstalled) {
    document.effects[0].changes.push({
      key: "flags.midi-qol.OverTime",
      mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
      value: "label=Hideous Laughter (End of Turn),turn=end,saveDC=@attributes.spelldc,saveAbility=wis,saveMagic=true,killAnim=true",
      priority: "20",
    });

    await DDBMacros.setItemMacroFlag(document, "spell", "hideousLaughter.js");
    document.effects[0].changes.push(DDBMacros.generateMacroChange({ macroType: "spell", macroName: "hideousLaughter.js" }));
  }
  return document;
}
