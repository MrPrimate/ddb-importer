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
  foundry.utils.setProperty(effect, "flags.dae.specialDuration", ["turnEnd"]);
  foundry.utils.setProperty(effect, "duration.rounds", 1);
  document.effects.push(effect);

  const damageOne = foundry.utils.duplicate(document.system.damage.parts[0]);
  const damageTwo = foundry.utils.duplicate(document.system.damage.parts[1]);
  document.system.damage = { parts: [damageOne], versatile: "", value: "" };
  document.system.formula = damageTwo[0];
  document.system.actionType = "save";

  return document;
}
