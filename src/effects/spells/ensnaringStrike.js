import { baseSpellEffect } from "../specialSpells.js";
import { loadMacroFile, generateItemMacroFlag } from "../macros.js";

export async function ensnaringStrikeEffect(document) {
  let effect = baseSpellEffect(document, document.name);

  const itemMacroText = await loadMacroFile("spell", "ensnaringStrike.js");
  document = generateItemMacroFlag(document, itemMacroText);
  effect.changes.push({
    key: "flags.midi-qol.onUseMacroName",
    value: `ItemMacro.${document.name},postActiveEffects`,
    mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM,
    priority: "20",
  });
  setProperty(effect, "flags.dae.selfTarget", true);
  setProperty(effect, "flags.dae.selfTargetAlways", true);

  document.effects.push(effect);
  document.system.damage = { parts: [], versatile: "", value: "" };
  document.system.actionType = null;
  document.system.save.ability = "";
  setProperty(document, "flags.midi-qol.onUseMacroName", "[preTargeting]ItemMacro");

  return document;
}
