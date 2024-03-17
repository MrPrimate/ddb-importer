import { effectModules, generateATLChange } from "../effects.js";
import { baseSpellEffect } from "../specialSpells.js";
import DDBMacros from "../DDBMacros.js";

export async function crownofStarsEffect(document) {
  let effect = baseSpellEffect(document, document.name);

  if (effectModules().atlInstalled) {
    effect.changes.push(generateATLChange("ATL.light.dim", CONST.ACTIVE_EFFECT_MODES.UPGRADE, '60'));
    effect.changes.push(generateATLChange("ATL.light.bright", CONST.ACTIVE_EFFECT_MODES.UPGRADE, '30'));
  }
  foundry.utils.setProperty(effect, "flags.dae.selfTarget", true);
  foundry.utils.setProperty(effect, "flags.dae.selfTargetAlways", true);

  effect.changes.push(DDBMacros.generateMacroChange({ macroValues: "@spellLevel", macroType: "spell", macroName: "crownofStars.js" }));
  document.system.damage = { parts: [], versatile: "", value: "" };
  document.system.actionType = "other";
  document.effects.push(effect);

  await DDBMacros.setItemMacroFlag(document, "spell", "crownofStars.js");
  return document;
}
