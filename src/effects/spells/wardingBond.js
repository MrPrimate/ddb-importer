import { baseSpellEffect } from "../specialSpells.js";
import { loadMacroFile, generateMacroChange, generateItemMacroFlag } from "../macros.js";

export async function wardingBondEffect(document) {
  let effect = baseSpellEffect(document, document.name);
  effect.changes.push(
    { key: "data.attributes.ac.bonus", mode: CONST.ACTIVE_EFFECT_MODES.ADD, value: "1", priority: "20" },
    { key: "data.traits.dr.all", mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM, value: "1", priority: "20" },
    { key: "data.bonuses.abilities.save", mode: CONST.ACTIVE_EFFECT_MODES.ADD, value: "1", priority: "20" }
  );
  const itemMacroText = await loadMacroFile("spell", "wardingBond.js");
  document.flags["itemacro"] = generateItemMacroFlag(document, itemMacroText);
  effect.changes.push(generateMacroChange(""));
  document.effects.push(effect);

  return document;
}
