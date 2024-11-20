import DDBMacros from "../DDBMacros.mjs";
import { addStatusEffectChange, effectModules } from "../effects.js";
import { baseSpellEffect } from "../specialSpells.js";

export async function colorSprayEffect(document) {

  if (effectModules().midiQolInstalled) {
    DDBMacros.setMidiOnUseMacroFlag(document, "spell", "colorSpray.js", ["postActiveEffects"]);
    document.system.damage = { parts: [["6d10", "midi-none"]], versatile: "", value: "" };
    await DDBMacros.setItemMacroFlag(document, "spell", "colorSpray.js");
  } else {
    let effect = baseSpellEffect(document, `${document.name} - Blinded`);
    addStatusEffectChange({ effect, statusName: "Blinded" });
    document.effects.push(effect);

  }

  return document;
}
