// Vitriolic Sphere


import { baseSpellEffect } from "../specialSpells.js";

export function vitriolicSphereEffect(document) {

  let effect = baseSpellEffect(document, document.name);
  effect.changes.push(
    {
      key: "flags.midi-qol.OverTime",
      mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM,
      value: `turn=end,label=${document.name} (End of Turn),damageRoll=5d4,damageType=acid,removeCondition=true,killAnim=true`,
      priority: "20",
    }
  );
  setProperty(effect, "flags.dae.specialDuration", ["turnEnd"]);
  setProperty(effect, "duration.rounds", 1);
  document.effects.push(effect);

  const damageOne = duplicate(document.system.damage.parts[0]);
  const damageTwo = duplicate(document.system.damage.parts[1]);
  document.system.damage = { parts: [damageOne], versatile: "", value: "" };
  document.system.formula = damageTwo[0];
  document.system.actionType = "save";

  return document;
}
