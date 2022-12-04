import { baseSpellEffect, spellEffectModules } from "../specialSpells.js";
import { loadMacroFile, generateItemMacroFlag } from "../macros.js";

export async function spiritShroudEffect(document) {
  if (!spellEffectModules().activeAurasInstalled) return document;
  let effect = baseSpellEffect(document, document.name);

  effect.changes.push(
    {
      key: "flags.midi-qol.spiritShroud",
      mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
      value: "@uuid",
      priority: 20
    },
    {
      key: "system.attributes.movement.all",
      mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM,
      value: "-10",
      priority: "15",
    });
  effect.flags["ActiveAuras"] = {
    isAura: true,
    aura: "Enemy",
    radius: 10,
    alignment: "",
    type: "",
    ignoreSelf: true,
    height: false,
    hidden: false,
    hostile: false,
    onlyOnce: false,
    displayTemp: true,
  };
  setProperty(effect, "flags.dae.selfTarget", true);
  setProperty(effect, "flags.dae.selfTargetAlways", true);

  const itemMacroText = await loadMacroFile("spell", "spiritShroud.js");
  setProperty(document, "flags.itemacro", generateItemMacroFlag(document, itemMacroText));
  setProperty(document, "flags.midi-qol.onUseMacroName", "[preActiveEffects]ItemMacro");

  document.system.damage = { parts: [], versatile: "", value: "" };
  document.system['target']['type'] = "self";
  document.system.range = { value: null, units: "self", long: null };
  document.system.actionType = "other";
  document.system.save.ability = "";

  document.effects.push(effect);
  return document;
}
