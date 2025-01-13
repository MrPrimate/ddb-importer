import { baseSpellEffect } from "../specialSpells.js";
import { DDBMacros } from "../../lib/_module.mjs";
import { effectModules } from "../effects.js";

export async function cloudkillEffect(document) {
  // we require active auras for this effect
  if (!effectModules().activeAurasInstalled || !effectModules().midiQolInstalled) return document;

  await DDBMacros.setItemMacroFlag(document, "generic", "activeAuraDamageOnEntry.js".file);

  let effect = baseSpellEffect(document, document.name);
  effect.changes.push(
    {
      key: "flags.midi-qol.OverTime",
      mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM,
      value:
        `label=${document.name} (Start of Turn),turn=start, saveAbility=con, killAnim=true, saveDC=@attributes.spelldc, saveDamage=halfdamage, rollType=save, saveMagic=true, damageBeforeSave=false, damageRoll=(@item.level)d8, damageType=${document.system.damage.parts[0][1]}`,
      priority: "20",
    },
  );
  effect.changes.push(DDBMacros.generateMacroChange({ macroValues: "@item.level", macroType: "generic", macroName: "activeAuraDamageOnEntry.js".file }));
  effect.flags["ActiveAuras"] = {
    isAura: true,
    aura: "All",
    radius: 20,
    alignment: "",
    type: "",
    ignoreSelf: false,
    height: false,
    hidden: false,
    // hostile: true,
    onlyOnce: false,
    save: "str",
    savedc: null,
    displayTemp: true,
  };
  foundry.utils.setProperty(effect, "duration.seconds", 600);
  // foundry.utils.setProperty(effect, "flags.dae.macroRepeat", "startEveryTurn");
  DDBMacros.setMidiOnUseMacroFlag(document, "generic", "activeAuraDamageOnEntry.js".file, ["preActiveEffects"]);
  foundry.utils.setProperty(document, "flags.ddbimporter.effect", {
    dice: document.system.damage.parts[0][0],
    damageType: document.system.damage.parts[0][1],
    save: document.system.save.ability,
    sequencerFile: "jb2a.fog_cloud.2.green",
  });

  document.effects.push(effect);
  document.system.damage = { parts: [], versatile: "", value: "" };
  document.system.actionType = "other";
  document.system.save.ability = "";

  return document;
}
