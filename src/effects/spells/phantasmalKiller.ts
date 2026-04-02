import { effectModules } from "../effects";

export async function phantasmalKillerEffect(document) {
  if (effectModules().midiQolInstalled) {
    document.effects[0].system.changes.push({
      key: "flags.midi-qol.OverTime",
      type: "override",
      value:
        "label=Phantasmal Killer (End of Turn),turn=end,saveAbility=wis,saveDC=@attributes.spell.dc,saveMagic=true,damageRoll=(@item.level)d10,damageType=psychic,savingThrow=true,damageBeforeSave=false,killAnim=true",
      priority: "20",
    });
    document.system.damage = { parts: [], versatile: "", value: "" };
  }

  return document;
}
