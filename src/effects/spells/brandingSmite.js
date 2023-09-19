import DDBMacros from "../macros.js";
import { baseSpellEffect } from "../specialSpells.js";

export async function brandingSmiteEffect(document) {
  let effect = baseSpellEffect(document, document.name);
  effect.changes.push(
    {
      key: "flags.dnd5e.DamageBonusMacro",
      value: "ItemMacro.Branding Smite",
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
  setProperty(effect, "flags.dae.specialDuration", ["1Hit:rwak", "1Hit:mwak"]);

  const itemMacroText = await DDBMacros.loadMacroFile("spell", "brandingSmite.js");
  document = DDBMacros.generateItemMacroFlag(document, itemMacroText);

  document.system.actionType = "other";
  document.system.target.type = "self";
  document.system.damage.parts = [];
  document.effects.push(effect);
  DDBMacros.setMidiOnUseMacroFlag(document, "spell", "brandingSmite.js", ["postActiveEffects"]);
  return document;
}
