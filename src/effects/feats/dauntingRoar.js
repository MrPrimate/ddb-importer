

import { addStatusEffectChange } from "../effects.js";
import { baseFeatEffect } from "../specialFeats.js";

export function dauntingRoarEffect(document) {
  const effect = baseFeatEffect(document, document.name);
  addStatusEffectChange(effect, "Frightened", 20, true);
  foundry.utils.setProperty(effect, "flags.dae.specialDuration", ["turnEndSource", "endCombat"]);
  effect.duration.seconds = 12;
  effect.duration.turns = 2;

  document.effects.push(effect);
  // document.system.range = { value: null, units: "spec", long: null };
  // document.system.target = { value: 10, width: null, units: "ft", type: "enemy" };
  // document.system.activation.condition = "!target.effects.some((e) => e.name.toLowerCase().includes('deafened'))";

  foundry.utils.setProperty(document.flags, "midi-qol.effectActivation", true);

  foundry.utils.setProperty(document, "flags.midi-qol.itemCondition", "");
  foundry.utils.setProperty(document, "flags.midi-qol.effectCondition", "!target.effects.some((e) => e.name.toLowerCase().includes('deafened'))");
  foundry.utils.setProperty(document, "flags.midi-qol.AoETargetType", "enemy");
  foundry.utils.setProperty(document, "flags.midi-qol.AoETargetTypeIncludeSelf", false);

  return document;
}
