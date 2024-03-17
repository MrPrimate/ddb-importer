import { baseFeatEffect } from "../specialFeats.js";
import { addStatusEffectChange } from "../effects.js";

export function fireRuneEffect(document) {
  foundry.utils.setProperty(document, "system.range.units", "");
  foundry.utils.setProperty(document, "system.target.value", 1);
  foundry.utils.setProperty(document, "system.target.type", "creature");

  let baseEffect = baseFeatEffect(document, document.name);
  foundry.utils.setProperty(baseEffect, "duration.seconds", 60);

  addStatusEffectChange(baseEffect, "Restrained", 20, true);

  baseEffect.changes.push(
    {
      key: "flags.midi-qol.OverTime",
      mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
      value: `label=${document.name} (Start of Turn Damage),turn=start,savingThrow=false,damageRoll=${document.system.damage.parts[0][0]}, damageType=${document.system.damage.parts[0][1]},killAnim=true`,
      priority: "20",
    },
    {
      key: "flags.midi-qol.OverTime",
      mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
      value: `label=${document.name} (End of Turn Save),turn=end,saveDC=@attributes.spelldc,saveAbility=${document.system.save.ability},savingThrow=true,saveMagic=true,saveRemove=true,killAnim=true`,
      priority: "20",
    }
  );

  document.effects.push(baseEffect);
  return document;
}
