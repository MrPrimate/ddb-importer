import { effectModules, generateATLChange } from "../effects.js";
import { baseSpellEffect } from "../specialSpells.js";
import DDBMacros from "../macros.js";

export async function crownofStarsEffect(document) {
  let effect = baseSpellEffect(document, document.name);

  if (effectModules().atlInstalled) {
    effect.changes.push(generateATLChange("ATL.light.dim", CONST.ACTIVE_EFFECT_MODES.UPGRADE, '60'));
    effect.changes.push(generateATLChange("ATL.light.bright", CONST.ACTIVE_EFFECT_MODES.UPGRADE, '30'));
  }
  setProperty(effect, "flags.dae.selfTarget", true);
  setProperty(effect, "flags.dae.selfTargetAlways", true);

  const itemMacroText = await DDBMacros.loadMacroFile("spell", "crownofStars.js");
  document = DDBMacros.generateItemMacroFlag(document, itemMacroText);
  effect.changes.push(DDBMacros.generateMacroChange("@spellLevel"));
  document.system.damage = { parts: [], versatile: "", value: "" };
  document.system.actionType = "other";
  document.effects.push(effect);

  return document;
}
