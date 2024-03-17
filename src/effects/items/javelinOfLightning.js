import { baseItemEffect } from "../effects.js";
import DDBMacros from "../DDBMacros.js";

export async function javelinOfLightningEffect(document) {
  let effect = baseItemEffect(document, `${document.name}: Used Effect Tracker`);
  await DDBMacros.setItemMacroFlag(document, "item", "javelinOfLightning.js");
  effect.changes.push(DDBMacros.generateMacroChange({ macroValues: `"${document.name}"`, macroType: "item", macroName: "javelinOfLightning.js" }));
  effect.transfer = false;
  foundry.utils.setProperty(effect, "flags.dae.specialDuration", ["newDay", "longRest"]);
  foundry.utils.setProperty(effect, "flags.dae.selfTarget", true);
  foundry.utils.setProperty(effect, "flags.dae.selfTargetAlways", true);
  document.effects.push(effect);

  DDBMacros.setMidiOnUseMacroFlag(document, "item", "javelinOfLightning.js", ["postActiveEffects", "postDamageRoll", "preAttackRoll"]);

  // foundry.utils.setProperty(document.effects[0], "flags.dae.specialDuration", ["isDamaged"]);
  document.system.uses = {
    value: null,
    max: "",
    per: "",
  };

  document.system.formula = "";

  return document;
}
