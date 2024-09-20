import DDBMacros from "../DDBMacros.js";
import { effectModules } from "../effects.js";

export async function sleepEffect(document) {

  if (effectModules().midiQolInstalled) {
    document.effects = [];
    await DDBMacros.setItemMacroFlag(document, "spell", "sleep.js");
    DDBMacros.setMidiOnUseMacroFlag(document, "spell", "sleep.js", ["postActiveEffects"]);
    document.system.damage = { parts: [["5d8", "midi-none"]], versatile: "", value: "" };
  }

  return document;
}
