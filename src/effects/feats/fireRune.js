import { baseFeatEffect } from "../specialFeats.js";
import { generateStatusEffectChange } from "../effects.js";

export async function fireRuneEffect(document) {
  let baseEffect = baseFeatEffect(document, document.name);
  setProperty(document, "data.range.units", "");
  setProperty(baseEffect, "duration.seconds", 60);
  setProperty(document, "data.target.value", 1);
  setProperty(document, "data.target.type", "creature");

  baseEffect.changes.push(generateStatusEffectChange("Restrained"));
  baseEffect.changes.push(
    {
      key: "flags.midi-qol.OverTime",
      mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
      value: `label=${document.name} (Start of Turn Damage),turn=start,savingThrow=false,damageRoll=${document.data.damage.parts[0][0]}, damageType=${document.data.damage.parts[0][1]}`,
      priority: "20",
    },
    {
      key: "flags.midi-qol.OverTime",
      mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
      value: `label=${document.name} (End of Turn Save),turn=end,saveDC=@attributes.spelldc,saveAbility=${document.data.save.ability},savingThrow=true,saveMagic=true,saveRemove=true`,
      priority: "20",
    }
  );

  // Missing: prof bonus expertise for tool

  document.effects.push(baseEffect);
  return document;
}
