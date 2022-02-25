import { baseItemEffect } from "../effects.js";

export function horrifyingVisageEffect(document) {
  setProperty(document, "data.duration", { value: 1, units: "minute" });
  setProperty(document, "data.target", { value: 60, width: null, units: "ft", type: "enemy" });
  setProperty(document, "data.range", { value: 60, long: null, units: "spec" });

  let effect = baseItemEffect(document, document.name);
  effect.changes.push(
    {
      "key": "flags.midi-qol.OverTime",
      "mode": 5,
      "value": "turn=end,saveAbility=wis,saveDC=13,saveMagic=true,label=Frightened",
      "priority": "20"
    },
    {
      "key": "macro.CE",
      "mode": 0,
      "value": "Frightened",
      "priority": "20"
    }
  );
  effect.transfer = false;

  document.effects.push(effect);
  return document;
}
