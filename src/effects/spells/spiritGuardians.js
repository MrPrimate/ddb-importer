import { baseSpellEffect, spellEffectModules } from "../specialSpells.js";
import { loadMacroFile, generateMacroChange, generateItemMacroFlag } from "../macros.js";

export async function spiritGuardiansEffect(document) {
  // we require active auras for this effect
  if (!spellEffectModules().activeAurasInstalled) return document;

  let effect = baseSpellEffect(document, document.name);
  effect.changes.push(
    {
      key: "system.attributes.movement.all",
      mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM,
      value: "/2",
      priority: "20",
    },
    {
      key: "flags.midi-qol.OverTime",
      mode: CONST.ACTIVE_EFFECT_MODES.ADD,
      value:
        "turn=start,label=Spirit Guardians (Start of Turn),damageRoll=(@spellLevel)d8,damageType=radiant,saveRemove=false,saveDC=@attributes.spelldc,saveAbility=wis,saveDamage=halfdamage,killAnim=true",
      priority: "20",
    }
  );
  const itemMacroText = await loadMacroFile("spell", "spiritGuardians.js");
  document.flags["itemacro"] = generateItemMacroFlag(document, itemMacroText);
  effect.flags["ActiveAuras"] = {
    isAura: true,
    aura: "Enemy",
    radius: 15,
    alignment: "",
    type: "",
    ignoreSelf: true,
    height: false,
    hidden: false,
    hostile: false,
    onlyOnce: false,
    displayTemp: true,
  };
  effect.changes.push(generateMacroChange("@token @spellLevel @attributes.spelldc"));
  setProperty(effect, "flags.dae.selfTarget", true);
  document.effects.push(effect);

  document.system.damage = { parts: [], versatile: "", value: "" };
  document.system['target']['type'] = "self";
  document.system.range = { value: 15, units: "ft", long: null };
  document.system.actionType = "";
  document.system.save.ability = "";

  return document;
}
