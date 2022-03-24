import { baseSpellEffect } from "../specialSpells.js";
import { loadMacroFile, generateMacroChange, generateItemMacroFlag } from "../macros.js";

export async function spiritualWeaponEffect(document) {
  let effect = baseSpellEffect(document, document.name);
  const itemMacroText = await loadMacroFile("spell", "spiritualWeapon.js");
  document.flags["itemacro"] = generateItemMacroFlag(document, itemMacroText);
  effect.changes.push(generateMacroChange("@item.level"));
  setProperty(effect, "flags.dae.selfTarget", true);
  document.effects.push(effect);

  document.system.damage = { parts: [], versatile: "", value: "" };
  document.system['target']['type'] = "self";
  // document.system.range = { value: null, units: "self", long: null };
  document.system.actionType = "other";

  return document;
}
