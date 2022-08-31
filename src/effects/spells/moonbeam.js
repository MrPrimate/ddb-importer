import { baseSpellEffect } from "../specialSpells.js";
import { loadMacroFile, generateMacroChange, generateItemMacroFlag } from "../macros.js";

export async function moonbeamEffect(document) {
  let effect = baseSpellEffect(document, document.name);
  effect.flags.dae.macroRepeat = "startEveryTurn";
  const itemMacroText = await loadMacroFile("spell", "moonbeam.js");
  document.flags["itemacro"] = generateItemMacroFlag(document, itemMacroText);
  effect.changes.push(generateMacroChange("@spellLevel"));
  setProperty(effect, "flags.dae.selfTarget", true);
  document.effects.push(effect);
  document.system.damage = { parts: [], versatile: "", value: "" };
  document.system['target']['type'] = "self";
  // document.system.range = { value: null, units: "self", long: null };
  document.system.actionType = "other";
  document.system.save.ability = "";

  return document;
}
