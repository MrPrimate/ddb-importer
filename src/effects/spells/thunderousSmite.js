import { loadMacroFile, generateItemMacroFlag, setMidiOnUseMacroFlag } from "../macros.js";
import { baseSpellEffect } from "../specialSpells.js";

export async function thunderousSmiteEffect(document) {
  let effect = baseSpellEffect(document, document.name);
  effect.changes.push(
    {
      key: "flags.dnd5e.DamageBonusMacro",
      value: "ItemMacro.Thunderous Smite",
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
  setProperty(effect, "flags.dae.specialDuration", ["1Hit:mwak"]);
  setProperty(effect, "flags.dae.selfTarget", true);
  setProperty(effect, "flags.dae.selfTargetAlways", true);

  const itemMacroText = await loadMacroFile("spell", "thunderousSmite.js");
  document = generateItemMacroFlag(document, itemMacroText);
  document.system.damage.parts = [];
  document.system.save.ability = "";
  document.system.actionType = "other";
  document.effects.push(effect);
  setMidiOnUseMacroFlag(document, "spell", "thunderousSmite.js", ["postActiveEffects", "preTargeting"]);

  return document;
}
