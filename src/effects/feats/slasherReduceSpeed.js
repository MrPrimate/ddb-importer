
import { baseFeatEffect } from "../specialFeats.js";
import DDBMacros from "../DDBMacros.js";

export async function slasherReduceSpeedEffect(document) {
  const effect = baseFeatEffect(document, document.name, { transfer: true });
  effect.changes.push(
    {
      key: "flags.dnd5e.DamageBonusMacro",
      value: DDBMacros.generateItemMacroValue({ macroType: "feat", macroName: "slasherReduceSpeed.js", document }),
      mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM,
      priority: 20,
    },
  );
  document.effects.push(effect);
  document.system.actionType = null;
  await DDBMacros.setItemMacroFlag(document, "feat", "slasherReduceSpeed.js");
  return document;
}
