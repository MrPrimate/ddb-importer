import { baseFeatEffect } from "../specialFeats.js";
import { generateStatusEffectChange } from "../effects.js";

export function fireRuneEffect(document) {
  setProperty(document, "system.range.units", "");
  setProperty(document, "system.target.value", 1);
  setProperty(document, "system.target.type", "creature");

  let baseEffect = baseFeatEffect(document, document.name);
  setProperty(baseEffect, "duration.seconds", 60);

  baseEffect.changes.push(generateStatusEffectChange("Restrained", 20, true));
  baseEffect.changes.push(
    {
      key: "flags.midi-qol.OverTime",
      mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
      value: `label=${document.name} (Start of Turn Damage),turn=start,savingThrow=false,damageRoll=${document.system.damage.parts[0][0]}, damageType=${document.system.damage.parts[0][1]}`,
      priority: "20",
    },
    {
      key: "flags.midi-qol.OverTime",
      mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
      value: `label=${document.name} (End of Turn Save),turn=end,saveDC=@attributes.spelldc,saveAbility=${document.system.save.ability},savingThrow=true,saveMagic=true,saveRemove=true`,
      priority: "20",
    }
  );

  document.effects.push(baseEffect);
  return document;
}
