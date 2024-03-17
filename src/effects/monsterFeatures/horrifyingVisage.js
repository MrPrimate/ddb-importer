import { addStatusEffectChange } from "../effects.js";
import { baseFeatEffect } from "../specialFeats.js";

export function horrifyingVisageEffect(document) {
  foundry.utils.setProperty(document, "system.duration", { value: 1, units: "minute" });
  foundry.utils.setProperty(document, "system.target", { value: 60, width: null, units: "ft", type: "enemy" });
  foundry.utils.setProperty(document, "system.range", { value: 60, long: null, units: "spec" });

  let effect = baseFeatEffect(document, document.name);
  effect.changes.push(
    {
      "key": "flags.midi-qol.OverTime",
      "mode": CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
      "value": "turn=end,saveAbility=wis,saveDC=13,saveMagic=true,label=Frightened,killAnim=true",
      "priority": "20"
    },
  );
  addStatusEffectChange(effect, "Frightened", 20, true);
  effect.transfer = false;

  document.effects.push(effect);
  return document;
}
