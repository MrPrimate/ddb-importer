import { baseSpellEffect } from "../specialSpells.js";
import DDBMacros from "../DDBMacros.js";
import { effectModules } from "../effects.js";

export async function spiritGuardiansEffect(document) {
  // we require active auras for this effect
  if (!effectModules().activeAurasInstalled) return document;

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
  await DDBMacros.setItemMacroFlag(document, "spell", "spiritGuardians.js");
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
  effect.changes.push(DDBMacros.generateMacroChange({ macroValues: "@token @spellLevel @attributes.spelldc", macroType: "spell", macroName: "spiritGuardians.js" }));
  foundry.utils.setProperty(effect, "flags.dae.selfTarget", true);
  foundry.utils.setProperty(effect, "flags.dae.selfTargetAlways", true);
  document.effects.push(effect);

  document.system.damage = { parts: [], versatile: "", value: "" };
  document.system['target']['type'] = "self";
  document.system.range = { value: 15, units: "ft", long: null };
  document.system.actionType = "";
  document.system.save.ability = "";

  return document;
}
