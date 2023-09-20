import { baseSpellEffect } from "../specialSpells.js";
import DDBMacros from "../macros.js";

export async function spiritualWeaponEffect(document) {
  let effect = baseSpellEffect(document, document.name);
  const itemMacroText = await DDBMacros.loadMacroFile("spell", "spiritualWeapon.js");
  document = DDBMacros.generateItemMacroFlag(document, itemMacroText);
  effect.changes.push(DDBMacros.generateMacroChange({ macroValues: "@item.level", macroType: "spell", macroName: "spiritualWeapon.js" }));
  setProperty(effect, "flags.dae.selfTarget", true);
  setProperty(effect, "flags.dae.selfTargetAlways", true);
  document.effects.push(effect);

  document.system.damage = { parts: [], versatile: "", value: "" };
  document.system.actionType = "other";

  return document;
}
