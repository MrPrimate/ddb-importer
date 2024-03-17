import { baseSpellEffect } from "../specialSpells.js";
import DDBMacros from "../DDBMacros.js";

// this one is a bit different, the macro is triggered by midi-qol and applies effects to the actor
// the Marked effect gets applied to the target
export async function huntersMarkEffect(document) {
  let effect = baseSpellEffect(document, "Marked");
  effect.changes.push(
    {
      key: "flags.dae.onUpdateSource",
      mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM,
      value: "Hunter's Mark",
      priority: 20,
    },
  );
  effect.duration.seconds = 3600;
  document.effects.push(effect);

  let damageBonusEffect = baseSpellEffect(document, "Hunter's Mark");
  damageBonusEffect.changes.push({
    key: "flags.dnd5e.DamageBonusMacro",
    value: DDBMacros.generateItemMacroValue({ macroType: "spell", macroName: "huntersMark.js", document }),
    mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM,
    priority: 20,
  });
  damageBonusEffect.transfer = true;

  foundry.utils.setProperty(damageBonusEffect, "flags.dae.transfer", true);
  document.effects.push(damageBonusEffect);

  await DDBMacros.setItemMacroFlag(document, "spell", "huntersMark.js");
  foundry.utils.setProperty(document, "system.actionType", "util");

  return document;
}
