import DDBMacros from "../DDBMacros.js";
import { baseSpellEffect } from "../specialSpells.js";

export async function thunderousSmiteEffect(document) {
  let effect = baseSpellEffect(document, document.name);
  effect.changes.push(
    {
      key: "flags.dnd5e.DamageBonusMacro",
      value: DDBMacros.generateItemMacroValue({ macroType: "spell", macroName: "thunderousSmite.js", document }),
      mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM,
      priority: "20",
    },
    {
      key: "flags.midi-qol.thunderousSmite.dc",
      value: "@attributes.spelldc",
      mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
      priority: "20",
    },
  );
  foundry.utils.setProperty(effect, "flags.dae.specialDuration", ["1Hit:mwak"]);
  foundry.utils.setProperty(effect, "flags.dae.selfTarget", true);
  foundry.utils.setProperty(effect, "flags.dae.selfTargetAlways", true);


  document.system.damage.parts = [];
  document.system.save.ability = "";
  document.system.actionType = "other";
  document.effects.push(effect);
  DDBMacros.setMidiOnUseMacroFlag(document, "spell", "thunderousSmite.js", ["postActiveEffects", "preTargeting"]);
  await DDBMacros.setItemMacroFlag(document, "spell", "thunderousSmite.js");

  return document;
}
