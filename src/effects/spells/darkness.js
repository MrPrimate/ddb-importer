import { baseSpellEffect } from "../specialSpells.js";
import DDBMacros from "../macros.js";

export async function darknessEffect(document) {
  let effect = baseSpellEffect(document, document.name);
  // setProperty(effect, "flags.dae.selfTarget", true);
  setProperty(effect, "flags.dae.selfTargetAlways", true);
  const itemMacroText = await DDBMacros.loadMacroFile("spell", "darkness.js");
  document = DDBMacros.generateItemMacroFlag(document, itemMacroText);
  effect.changes.push(DDBMacros.generateMacroChange(""));
  document.effects.push(effect);
  DDBMacros.setMidiOnUseMacroFlag(document, "spell", "darkness.js", ["preTargeting"]);
  return document;
}
