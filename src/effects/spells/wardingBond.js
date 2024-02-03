import { baseSpellEffect } from "../specialSpells.js";
import DDBMacros from "../DDBMacros.js";
import { effectModules } from "../effects.js";

export async function wardingBondEffect(document) {
  let effect = baseSpellEffect(document, document.name);
  effect.changes.push(
    { key: "system.attributes.ac.bonus", mode: CONST.ACTIVE_EFFECT_MODES.ADD, value: "+ 1", priority: "20" },
    { key: "system.traits.dr.all", mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM, value: "1", priority: "20" },
    { key: "system.bonuses.abilities.save", mode: CONST.ACTIVE_EFFECT_MODES.ADD, value: "+ 1", priority: "20" }
  );

  if (effectModules().midiQolInstalled) {
    await DDBMacros.setItemMacroFlag(document, "spell", "wardingBond.js");
    effect.changes.push(DDBMacros.generateMacroChange({ macroType: "spell", macroName: "wardingBond.js" }));
    document.effects.push(effect);
  }

  return document;
}
