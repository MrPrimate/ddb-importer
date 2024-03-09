
import { baseFeatEffect } from "../specialFeats.js";
import DDBMacros from "../DDBMacros.js";


export async function sneakAttackEffect(document) {
  const effect = baseFeatEffect(document, document.name, { transfer: true });
  await DDBMacros.setItemMacroFlag(document, "feat", "sneakAttack.js");
  effect.changes.push(
    {
      key: "flags.dnd5e.DamageBonusMacro",
      value: DDBMacros.generateItemMacroValue({ macroType: "feat", macroName: "sneakAttack.js", document }),
      mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM,
      priority: 20,
    },
  );
  document.effects.push(effect);
  document.system.damage.parts = [];
  document.system.actionType = null;

  document.system.duration = {
    value: 24,
    units: "hours",
  };

  document.system.target = {
    value: null,
    width: null,
    units: "",
    type: "self",
  };
  document.system.range = {
    value: null,
    long: null,
    units: "self",
  };
  return document;
}
