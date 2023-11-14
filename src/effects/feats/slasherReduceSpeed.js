
import { baseFeatEffect } from "../specialFeats.js";
import DDBMacros from "../DDBMacros.js";

export async function slasherReduceSpeedEffect(document) {
  const effect = baseFeatEffect(document, document.name);
  effect.changes.push(
    {
      key: "flags.dnd5e.DamageBonusMacro",
      value: "ItemMacro",
      mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM,
      priority: 20,
    },
  );
  effect.transfer = true;

  setProperty(effect, "flags.dae.transfer", true);
  document.effects.push(effect);
  document.system.actionType = null;
  await DDBMacros.setItemMacroFlag(document, "feat", "slasherReduceSpeed.js");
  return document;
}
