import DDBMacros from "../DDBMacros.js";
import { addStatusEffectChange, effectModules } from "../effects.js";
import { baseSpellEffect } from "../specialSpells.js";

export async function sleepEffect(document) {

  if (effectModules().midiQolInstalled) {
    await DDBMacros.setItemMacroFlag(document, "spell", "sleep.js");
    DDBMacros.setMidiOnUseMacroFlag(document, "spell", "sleep.js", ["postActiveEffects"]);
    document.system.damage = { parts: [["5d8", "midi-none"]], versatile: "", value: "" };
  } else {
    let effect = baseSpellEffect(document, `${document.name} - Unconscious`);
    addStatusEffectChange(effect, "Unconscious", 20, true);
    document.effects.push(effect);
  }

  return document;
}
