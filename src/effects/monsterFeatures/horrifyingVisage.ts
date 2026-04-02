import { addStatusEffectChange, baseFeatEffect } from "../effects";

export function horrifyingVisageEffect(document) {
  foundry.utils.setProperty(document, "system.duration", { value: 1, units: "minute" });
  foundry.utils.setProperty(document, "system.target", { value: 60, width: null, units: "ft", type: "enemy" });
  foundry.utils.setProperty(document, "system.range", { value: 60, long: null, units: "spec" });

  const effect = baseFeatEffect(document, document.name);
  effect.system.changes.push(
    {
      "key": "flags.midi-qol.OverTime",
      "type": "override",
      "value": "turn=end,saveAbility=wis,saveDC=13,saveMagic=true,label=Frightened,killAnim=true",
      "priority": "20",
    },
  );
  addStatusEffectChange({ effect, statusName: "Frightened" });
  effect.transfer = false;

  document.effects.push(effect);
  return document;
}
