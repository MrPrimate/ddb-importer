import DDBMacros from "../DDBMacros.js";
import { forceItemEffect } from "../effects.js";

export async function beholderEyeRaysEffect(document, rayNum = 3, range = 120) {
  setProperty(document, "system.target", { value: rayNum, width: null, units: "", type: "creature" });
  setProperty(document, "system.range", { value: range, long: null, units: "ft" });
  setProperty(document, "system.damage", { parts: [], versatile: "", value: "" });
  setProperty(document, "system.activation.type", "action");
  setProperty(document, "system.actionType", "other");

  await DDBMacros.setItemMacroFlag(document, "monsterFeature", "eyeRays.js");
  DDBMacros.setMidiOnUseMacroFlag(document, "monsterFeature", "eyeRays.js", ["postActiveEffects"]);

  document.system.save = {
    dc: null,
    ability: "",
    scaling: "spell",
  };

  setProperty(document, "flags.midiProperties.magiceffect", true);

  document.effects = [];
  document = forceItemEffect(document);
  return document;
}
