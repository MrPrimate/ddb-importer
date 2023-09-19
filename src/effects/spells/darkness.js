import { baseSpellEffect } from "../specialSpells.js";
import { loadMacroFile, generateMacroChange, generateItemMacroFlag, setMidiOnUseMacroFlag } from "../macros.js";

export async function darknessEffect(document) {
  let effect = baseSpellEffect(document, document.name);
  // setProperty(effect, "flags.dae.selfTarget", true);
  setProperty(effect, "flags.dae.selfTargetAlways", true);
  const itemMacroText = await loadMacroFile("spell", "darkness.js");
  document = generateItemMacroFlag(document, itemMacroText);
  effect.changes.push(generateMacroChange(""));
  document.effects.push(effect);
  setMidiOnUseMacroFlag(document, "spell", "darkness.js", ["preTargeting"]);
  return document;
}
