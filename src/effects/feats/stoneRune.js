import { baseFeatEffect } from "../specialFeats.js";
import { generateStatusEffectChange } from "../effects.js";

export function stoneRuneEffect(document) {
  setProperty(document, "system.target.value", 1);
  setProperty(document, "system.target.type", "creature");
  setProperty(document, "system.range.units", "ft");
  setProperty(document, "system.range.value", 30);

  let bonusEffect = baseFeatEffect(document, `${document.name} (Charm Effect)`);
  if (isNewerVersion(11, game.version)) {
    setProperty(bonusEffect, "flags.core.statusId", `${document.name} (Charm Effect)`);
  } else {
    bonusEffect.statuses.push(`${document.name} (Charm Effect)`);
  }
  setProperty(bonusEffect, "duration.seconds", 60);
  bonusEffect.changes.push(generateStatusEffectChange("Charmed", 20, true));
  bonusEffect.changes.push(generateStatusEffectChange("Incapacitated", 20, true));
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
