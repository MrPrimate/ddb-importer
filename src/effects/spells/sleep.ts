import { DDBMacros } from "../../lib/_module";
import { effectModules } from "../effects";

export async function sleepEffect(document) {

  if (effectModules().midiQolInstalled) {
    document.effects = [];
    await DDBMacros.setItemMacroFlag(document, "spell", "sleep.js");
    DDBMacros.setMidiOnUseMacroFlag(document, "spell", "sleep.js", ["postActiveEffects"]);
    document.system.damage = { parts: [["5d8", "midi-none"]], versatile: "", value: "" };
  }

  return document;
}
