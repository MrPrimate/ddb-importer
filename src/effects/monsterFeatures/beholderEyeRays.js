import DDBMacros from "../DDBMacros.js";
import { forceItemEffect } from "../effects.js";

export async function beholderEyeRaysEffect(document, rayNum = 3, range = 120) {
  foundry.utils.setProperty(document, "system.target", { value: rayNum, width: null, units: "", type: "creature" });
  foundry.utils.setProperty(document, "system.range", { value: range, long: null, units: "ft" });
  foundry.utils.setProperty(document, "system.damage", { parts: [], versatile: "", value: "" });
  foundry.utils.setProperty(document, "system.activation.type", "action");
  foundry.utils.setProperty(document, "system.actionType", "other");

  await DDBMacros.setItemMacroFlag(document, "monsterFeature", "eyeRays.js");
  DDBMacros.setMidiOnUseMacroFlag(document, "monsterFeature", "eyeRays.js", ["postActiveEffects"]);

  document.system.save = {
    dc: null,
    ability: "",
    scaling: "spell",
  };

  foundry.utils.setProperty(document, "flags.midiProperties.magiceffect", true);

  document.effects = [];
  document = forceItemEffect(document);
  return document;
}
