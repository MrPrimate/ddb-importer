import { baseSpellEffect } from "../specialSpells.js";
import DDBMacros from "../DDBMacros.js";
import { effectModules } from "../effects.js";

export async function spiritShroudEffect(document) {
  if (!effectModules().activeAurasInstalled) return document;
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
  foundry.utils.setProperty(effect, "flags.dae.selfTarget", true);
  foundry.utils.setProperty(effect, "flags.dae.selfTargetAlways", true);

  await DDBMacros.setItemMacroFlag(document, "spell", "spiritShroud.js");
  DDBMacros.setMidiOnUseMacroFlag(document, "spell", "spiritShroud.js", ["preActiveEffects"]);

  document.system.damage = { parts: [], versatile: "", value: "" };
  document.system['target']['type'] = "self";
  document.system.range = { value: null, units: "self", long: null };
  document.system.actionType = "other";
  document.system.save.ability = "";

  document.effects.push(effect);
  return document;
}
