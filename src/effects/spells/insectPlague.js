import { baseSpellEffect } from "../specialSpells.js";
import DDBMacros from "../DDBMacros.js";
import { effectModules } from "../effects.js";

export async function insectPlagueEffect(document) {
  // we require active auras for this effect
  if (!effectModules().activeAurasInstalled) return document;

  await DDBMacros.setItemMacroFlag(document, "generic", DDBMacros.MACROS.ACTIVE_AURAS.AA_DAMAGE_ON_ENTRY.file);

  let effect = baseSpellEffect(document, document.name);
  effect.changes.push(
    {
      key: "flags.midi-qol.OverTime",
      mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM,
      value:
        `label=${document.name} Turn End,turn=end, saveAbility=con, saveDC=@attributes.spelldc, saveDamage=halfdamage, rollType=save, saveMagic=true, damageBeforeSave=false, damageRoll=(@item.level)d10, damageType=${document.system.damage.parts[0][1]}, killAnim=true`,
      priority: "20",
    },
  );
  effect.changes.push(DDBMacros.generateMacroChange({ macroValues: "@item.level", macroType: "generic", macroName: DDBMacros.MACROS.ACTIVE_AURAS.AA_DAMAGE_ON_ENTRY.file }));
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
    save: "dex",
    savedc: null,
    displayTemp: true,
  };
  foundry.utils.setProperty(effect, "duration.seconds", 600);
  // foundry.utils.setProperty(effect, "flags.dae.macroRepeat", "startEveryTurn");
  DDBMacros.setMidiOnUseMacroFlag(document, "generic", DDBMacros.MACROS.ACTIVE_AURAS.AA_DAMAGE_ON_ENTRY.file, ["preActiveEffects"]);
  foundry.utils.setProperty(document, "flags.ddbimporter.effect", {
    dice: document.system.damage.parts[0][0],
    damageType: document.system.damage.parts[0][1],
    save: document.system.save.ability,
    sequencerFile: "jb2a.butterflies.many.orange",
  });

  document.effects.push(effect);
  return document;
}
