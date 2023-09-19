import { baseItemEffect } from "../effects.js";
import DDBMacros from "../macros.js";

export async function javelinOfLightningEffect(document) {
  let effect = baseItemEffect(document, `${document.name}: Used Effect Tracker`);
  const itemMacroText = await DDBMacros.loadMacroFile("item", "javelinOfLightning.js");
  document = DDBMacros.generateItemMacroFlag(document, itemMacroText);
  effect.changes.push(DDBMacros.generateMacroChange(`"${document.name}"`));
  effect.transfer = false;
  setProperty(effect, "flags.dae.specialDuration", ["newDay", "longRest"]);
  setProperty(effect, "flags.dae.selfTarget", true);
  setProperty(effect, "flags.dae.selfTargetAlways", true);
  document.effects.push(effect);

  DDBMacros.setMidiOnUseMacroFlag(document, "item", "javelinOfLightning.js", ["postActiveEffects", "postDamageRoll", "preAttackRoll"]);

  // setProperty(document.effects[0], "flags.dae.specialDuration", ["isDamaged"]);
  document.system.uses = {
    value: null,
    max: "",
    per: "",
  };

  return document;
}
