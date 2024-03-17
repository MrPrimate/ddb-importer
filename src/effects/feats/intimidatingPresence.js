import { addStatusEffectChange } from "../effects.js";
import { baseFeatEffect } from "../specialFeats.js";

export function intimidatingPresenceEffect(document) {
  const effect = baseFeatEffect(document, document.name);
  addStatusEffectChange(effect, "Frightened", 20, true);
  foundry.utils.setProperty(effect, "flags.dae.specialDuration", ["turnEndSource"]);
  effect.duration.seconds = 12;
  effect.duration.turns = 2;
  document.effects.push(effect);

  // document.system.activation.condition = "!target.effects.some((e)=> e.name?.toLowerCase().includes('blind') || e.name?.toLowerCase().includes('deaf'))";
  foundry.utils.setProperty(document, "flags.midi-qol.effectCondition", "!target.effects.some((e)=> e.name?.toLowerCase().includes('blind') || e.name?.toLowerCase().includes('deaf'))");
  foundry.utils.setProperty(document.flags, "midi-qol.effectActivation", true);
  document.system.duration.units = "perm";

  return document;
}
