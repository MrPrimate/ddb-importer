import { baseSpellEffect } from "../specialSpells.js";
import { loadMacroFile, generateMacroChange, generateItemMacroFlag, setMidiOnUseMacroFlag } from "../macros.js";

export async function callLightningEffect(document) {
  let effect = baseSpellEffect(document, document.name);
  const itemMacroText = await loadMacroFile("spell", "callLightning.js");
  document = generateItemMacroFlag(document, itemMacroText);
  effect.changes.push(generateMacroChange("@spellLevel"));
  setProperty(effect, "flags.dae.selfTarget", true);
  setProperty(effect, "flags.dae.selfTargetAlways", true);
  document.effects.push(effect);
  setProperty(document, "system.actionType", "other");
  document.system.save.ability = "";
  setMidiOnUseMacroFlag(document, "spell", "callLightning.js", ["preTargeting"]);

  return document;
}
