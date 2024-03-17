import { baseFeatEffect } from "../specialFeats.js";
import { addStatusEffectChange } from "../effects.js";

export function stoneRuneEffect(document) {
  foundry.utils.setProperty(document, "system.target.value", 1);
  foundry.utils.setProperty(document, "system.target.type", "creature");
  foundry.utils.setProperty(document, "system.range.units", "ft");
  foundry.utils.setProperty(document, "system.range.value", 30);

  let bonusEffect = baseFeatEffect(document, `${document.name} (Charm Effect)`);
  bonusEffect.statuses.push(`${document.name} (Charm Effect)`);
  foundry.utils.setProperty(bonusEffect, "duration.seconds", 60);
  addStatusEffectChange(bonusEffect, "Charmed", 20, true);
  addStatusEffectChange(bonusEffect, "Incapacitated", 20, true);
  bonusEffect.changes.push(
    {
      key: "flags.midi-qol.OverTime",
      mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
      value: `label=${document.name} (End of Turn Save),turn=end,saveDC=@attributes.spelldc,saveAbility=${document.system.save.ability},savingThrow=true,saveMagic=true,saveRemove=true,killAnim=true`,
      priority: "20",
    }
  );

  document.effects.push(bonusEffect);

  return document;
}
