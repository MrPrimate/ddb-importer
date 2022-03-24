import { generateATLChange } from "../effects.js";
import { baseSpellEffect, spellEffectModules } from "../specialSpells.js";
import { loadMacroFile, generateMacroChange, generateItemMacroFlag } from "../macros.js";

export async function crownofStarsEffect(document) {
  let effect = baseSpellEffect(document, document.name);

  if (spellEffectModules().atlInstalled) {
    effect.changes.push(generateATLChange("ATL.dimLight", CONST.ACTIVE_EFFECT_MODES.UPGRADE, '60'));
    effect.changes.push(generateATLChange("ATL.brightLight", CONST.ACTIVE_EFFECT_MODES.UPGRADE, '30'));
  }
  setProperty(effect, "flags.dae.selfTarget", true);

  const itemMacroText = await loadMacroFile("spell", "crownofStars.js");
  document.flags["itemacro"] = generateItemMacroFlag(document, itemMacroText);
  effect.changes.push(generateMacroChange("@spellLevel"));
  document.system.damage = { parts: [], versatile: "", value: "" };
  document.system['target']['type'] = "self";
  document.system.range = { value: null, units: "self", long: null };
  document.system.actionType = "other";
  document.effects.push(effect);

  return document;
}
