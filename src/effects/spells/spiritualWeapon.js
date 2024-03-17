import { baseSpellEffect } from "../specialSpells.js";
import DDBMacros from "../DDBMacros.js";

export async function spiritualWeaponEffect(document) {
  let effect = baseSpellEffect(document, document.name);
  await DDBMacros.setItemMacroFlag(document, "spell", "spiritualWeapon.js");
  effect.changes.push(DDBMacros.generateMacroChange({ macroValues: "@item.level", macroType: "spell", macroName: "spiritualWeapon.js" }));
  foundry.utils.setProperty(effect, "flags.dae.selfTarget", true);
  foundry.utils.setProperty(effect, "flags.dae.selfTargetAlways", true);
  document.effects.push(effect);

  document.system.damage = { parts: [], versatile: "", value: "" };
  document.system.actionType = "other";

  return document;
}
