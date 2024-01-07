import { baseFeatEffect } from "../specialFeats.js";
import DDBMacros from "../DDBMacros.js";

export async function ragingStormTundraEffect(document) {
  const effect = baseFeatEffect(document, document.name);
  await DDBMacros.setItemMacroFlag(document, "feat", "ragingStormTundra.js");
  DDBMacros.setMidiOnUseMacroFlag(document, "feat", "ragingStormTundra.js", ["preTargeting"]);
  effect.changes.push(
    {
      key: "system.attributes.movement.all",
      mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM,
      value: "*0",
      priority: "20",
    },
  );
  document.effects.push(effect);
  return document;
}
