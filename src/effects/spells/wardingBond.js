import { baseSpellEffect } from "../specialSpells.js";
import DDBMacros from "../DDBMacros.js";
import { effectModules } from "../effects.js";

export async function wardingBondEffect(document) {
  let effect = baseSpellEffect(document, document.name);
  effect.changes.push(
    { key: "system.attributes.ac.bonus", mode: CONST.ACTIVE_EFFECT_MODES.ADD, value: "+ 1", priority: "20" },
    { key: "system.traits.dr.all", mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM, value: "1", priority: "20" },
    { key: "system.traits.dr.all", value: "", mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM, priority: 0 },
    { key: "system.traits.dr.value", value: "acid", mode: CONST.ACTIVE_EFFECT_MODES.ADD, priority: 0 },
    { key: "system.traits.dr.value", value: "bludgeoning", mode: CONST.ACTIVE_EFFECT_MODES.ADD, priority: 0 },
    { key: "system.traits.dr.value", value: "cold", mode: CONST.ACTIVE_EFFECT_MODES.ADD, priority: 0 },
    { key: "system.traits.dr.value", value: "fire", mode: CONST.ACTIVE_EFFECT_MODES.ADD, priority: 0 },
    { key: "system.traits.dr.value", value: "force", mode: CONST.ACTIVE_EFFECT_MODES.ADD, priority: 0 },
    { key: "system.traits.dr.value", value: "lightning", mode: CONST.ACTIVE_EFFECT_MODES.ADD, priority: 0 },
    { key: "system.traits.dr.value", value: "necrotic", mode: CONST.ACTIVE_EFFECT_MODES.ADD, priority: 0 },
    { key: "system.traits.dr.value", value: "piercing", mode: CONST.ACTIVE_EFFECT_MODES.ADD, priority: 0 },
    { key: "system.traits.dr.value", value: "poison", mode: CONST.ACTIVE_EFFECT_MODES.ADD, priority: 0 },
    { key: "system.traits.dr.value", value: "psychic", mode: CONST.ACTIVE_EFFECT_MODES.ADD, priority: 0 },
    { key: "system.traits.dr.value", value: "radiant", mode: CONST.ACTIVE_EFFECT_MODES.ADD, priority: 0 },
    { key: "system.traits.dr.value", value: "slashing", mode: CONST.ACTIVE_EFFECT_MODES.ADD, priority: 0 },
    { key: "system.traits.dr.value", value: "thunder", mode: CONST.ACTIVE_EFFECT_MODES.ADD, priority: 0 },
    { key: "system.bonuses.abilities.save", mode: CONST.ACTIVE_EFFECT_MODES.ADD, value: "+ 1", priority: "20" },
  );

  if (effectModules().midiQolInstalled) {
    await DDBMacros.setItemMacroFlag(document, "spell", "wardingBond.js");
    effect.changes.push(DDBMacros.generateMacroChange({ macroType: "spell", macroName: "wardingBond.js" }));
    document.effects.push(effect);
  }

  return document;
}
