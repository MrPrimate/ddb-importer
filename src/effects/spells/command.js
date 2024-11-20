import DDBMacros from "../DDBMacros.mjs";
import { effectModules } from "../effects.js";
import { baseSpellEffect } from "../specialSpells.js";

export async function commandEffect(document) {
  let effect = baseSpellEffect(document, document.name);

  if (effectModules().midiQolInstalled) {
    await DDBMacros.setItemMacroFlag(document, "spell", "command.js");
    DDBMacros.setMidiOnUseMacroFlag(document, "spell", "command.js", ["postSave"]);
    effect.changes.push(DDBMacros.generateMacroChange({ macroType: "spell", macroName: "command.js" }));
    effect.duration = {
      "seconds": 12,
      "rounds": 1,
      "turns": 1,
    };
    foundry.utils.setProperty(effect, "flags.dae.specialDuration", ["turnStart"]);
  }

  document.effects.push(effect);

  return document;
}
