import DDBMacros from "../DDBMacros.js";
import { baseSpellEffect } from "../specialSpells.js";

export async function brandingSmiteEffect(document) {
  let effect = baseSpellEffect(document, document.name);
  effect.changes.push(
    {
      key: "flags.dnd5e.DamageBonusMacro",
      value: DDBMacros.generateItemMacroValue({ macroType: "spell", macroName: "brandingSmite.js", document }),
      mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM,
      priority: "20",
    },
    {
      key: "flags.midi-qol.brandingSmite.level",
      value: "@item.level",
      mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
      priority: "20",
    },
  );
  foundry.utils.setProperty(effect, "flags.dae.specialDuration", ["1Hit:rwak", "1Hit:mwak"]);

  document.system.actionType = "other";
  document.system.target.type = "self";
  document.system.damage.parts = [];
  document.effects.push(effect);

  await DDBMacros.setItemMacroFlag(document, "spell", "brandingSmite.js");
  DDBMacros.setMidiOnUseMacroFlag(document, "spell", "brandingSmite.js", ["postActiveEffects"]);
  return document;
}
