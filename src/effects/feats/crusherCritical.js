
import { baseFeatEffect } from "../specialFeats.js";
import DDBMacros from "../macros.js";

export async function crusherCriticalEffect(document) {
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

  const itemMacroText = await DDBMacros.loadMacroFile("feat", "crusherCritical.js");
  document = DDBMacros.generateItemMacroFlag(document, itemMacroText);
  document.system.actionType = null;

  return document;
}
