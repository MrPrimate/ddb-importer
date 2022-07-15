import { baseFeatEffect } from "../specialFeats.js";
import { generateStatusEffectChange } from "../effects.js";

export async function stoneRuneEffect(document) {
  setProperty(document, "data.target.value", 1);
  setProperty(document, "data.target.type", "creature");
  setProperty(document, "data.range.units", "ft");
  setProperty(document, "data.range.value", 30);

  let bonusEffect = baseFeatEffect(document, `${document.name} (Charm Effect)`);
  setProperty(bonusEffect, "flags.core.statusId", `${document.name} (Charm Effect)`);
  setProperty(bonusEffect, "duration.seconds", 60);
  bonusEffect.changes.push(generateStatusEffectChange("Charmed", 20, true));
  bonusEffect.changes.push(generateStatusEffectChange("Incapacitated", 20, true));
  bonusEffect.changes.push(
    {
      key: "flags.midi-qol.OverTime",
      mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
      value: `label=${document.name} (End of Turn Save),turn=end,saveDC=@attributes.spelldc,saveAbility=${document.data.save.ability},savingThrow=true,saveMagic=true,saveRemove=true`,
      priority: "20",
    }
  );

  document.effects.push(bonusEffect);

  return document;
}
