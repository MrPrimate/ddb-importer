import { loadMacroFile, generateItemMacroFlag } from "../macros.js";
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
  setProperty(effect, "flags.dae.specialDuration", ["1Attack:rwak", "1Attack:mwak"]);

  const itemMacroText = await loadMacroFile("spell", "brandingSmite.js");
  document.flags["itemacro"] = generateItemMacroFlag(document, itemMacroText);

  document.data.actionType = "other";
  document.data.target.type = "self";
  document.data.damage.parts = [];
  document.effects.push(effect);
  setProperty(document, "flags.midi-qol.onUseMacroName", "");

  return document;
}
