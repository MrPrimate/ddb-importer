import { baseSpellEffect } from "../specialSpells.js";

export function acidArrowEffect(document) {
  let effect = baseSpellEffect(document, document.name);
  effect.changes.push({
    key: "flags.midi-qol.OverTime",
    mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM,
    value: `label=${document.name} (End of Turn),turn=end,damageRoll=(@spellLevel)d4[acid],damageType=acid,killAnim=true`,
    priority: "20",
  });
  effect.flags.dae.specialDuration = ["turnEnd"];
  effect.duration.rounds = 1;
  document.effects.push(effect);

  return document;
}
