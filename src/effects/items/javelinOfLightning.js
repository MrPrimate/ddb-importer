import { baseItemEffect } from "../effects.js";
import { loadMacroFile, generateMacroChange, generateItemMacroFlag } from "../macros.js";

export async function javelinOfLightningEffect(document) {
  let effect = baseItemEffect(document, `${document.name}: Used Effect Tracker`);
  const itemMacroText = await loadMacroFile("item", "javelinOfLightning.js");
  document = generateItemMacroFlag(document, itemMacroText);
  effect.changes.push(generateMacroChange(`"${document.name}"`));
  effect.transfer = false;
  setProperty(effect, "flags.dae.specialDuration", ["newDay", "longRest"]);
  setProperty(effect, "flags.dae.selfTarget", true);
  setProperty(effect, "flags.dae.selfTargetAlways", true);
  document.effects.push(effect);

  setProperty(document, "flags.midi-qol.onUseMacroName", "[postActiveEffects]ItemMacro,[postDamageRoll]ItemMacro,[preAttackRoll]ItemMacro");

  // setProperty(document.effects[0], "flags.dae.specialDuration", ["isDamaged"]);
  document.system.uses = {
    value: null,
    max: "",
    per: "",
  };

  return document;
}
