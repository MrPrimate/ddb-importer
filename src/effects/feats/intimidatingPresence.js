import { generateStatusEffectChange } from "../effects.js";
import { baseFeatEffect } from "../specialFeats.js";

export function intimidatingPresenceEffect(document) {
  const effect = baseFeatEffect(document, document.name);
  effect.changes.push(generateStatusEffectChange("Convenient Effect: Frightened", 20, true));
  setProperty(effect, "flags.dae.specialDuration", ["turnEndSource"]);
  effect.duration.seconds = 12;
  effect.duration.turns = 2;
  document.effects.push(effect);

  document.system.activation.condition = "!target.effects.some((e)=> e.name?.toLowerCase().includes('blind') || e.name?.toLowerCase().includes('deaf'))";
  setProperty(document.flags, "midi-qol.effectActivation", true);
  document.system.duration.units = "perm";

  return document;
}
