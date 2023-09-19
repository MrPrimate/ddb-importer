import { baseSpellEffect } from "../specialSpells.js";
import DDBMacros from "../macros.js";

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
    value: "ItemMacro",
    mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM,
    priority: 20,
  });
  damageBonusEffect.transfer = true;

  setProperty(damageBonusEffect, "flags.dae.transfer", true);
  document.effects.push(damageBonusEffect);

  const itemMacroText = await DDBMacros.loadMacroFile("spell", "huntersMark.js");
  document = DDBMacros.generateItemMacroFlag(document, itemMacroText);
  setProperty(document, "system.actionType", "util");

  return document;
}
