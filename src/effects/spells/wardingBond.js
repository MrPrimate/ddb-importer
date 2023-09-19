import { baseSpellEffect } from "../specialSpells.js";
import DDBMacros from "../macros.js";

export async function wardingBondEffect(document) {
  let effect = baseSpellEffect(document, document.name);
  effect.changes.push(
    { key: "system.attributes.ac.bonus", mode: CONST.ACTIVE_EFFECT_MODES.ADD, value: "1", priority: "20" },
    { key: "system.traits.dr.all", mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM, value: "1", priority: "20" },
    { key: "system.bonuses.abilities.save", mode: CONST.ACTIVE_EFFECT_MODES.ADD, value: "1", priority: "20" }
  );
  const itemMacroText = await DDBMacros.loadMacroFile("spell", "wardingBond.js");
  document = DDBMacros.generateItemMacroFlag(document, itemMacroText);
  effect.changes.push(DDBMacros.generateMacroChange(""));
  document.effects.push(effect);

  return document;
}
