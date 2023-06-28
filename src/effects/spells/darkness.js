import { baseSpellEffect } from "../specialSpells.js";
import { loadMacroFile, generateMacroChange, generateItemMacroFlag } from "../macros.js";

export async function darknessEffect(document) {
  let effect = baseSpellEffect(document, document.name);
  // setProperty(effect, "flags.dae.selfTarget", true);
  setProperty(effect, "flags.dae.selfTargetAlways", true);
  const itemMacroText = await loadMacroFile("spell", "darkness.js");
  document.flags["itemacro"] = generateItemMacroFlag(document, itemMacroText);
  effect.changes.push(generateMacroChange(""));
  document.effects.push(effect);
  setProperty(document, "flags.midi-qol.onUseMacroName", "[preTargeting]ItemMacro");
  return document;
}
