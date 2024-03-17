import { baseSpellEffect } from "../specialSpells.js";
import DDBMacros from "../DDBMacros.js";
import { effectModules } from "../effects.js";

export async function createBonfireEffect(document) {
  // we require active auras for this effect
  if (!effectModules().activeAurasInstalled) return document;

  await DDBMacros.setItemMacroFlag(document, "generic", DDBMacros.MACROS.ACTIVE_AURAS.AA_DAMAGE_ON_ENTRY.file);

  let effect = baseSpellEffect(document, document.name);
  effect.changes.push(
    {
      key: "flags.midi-qol.OverTime",
      mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM,
      value:
        "turn=end,label=Create Bonfire (End of Turn),damageRoll=(@cantripDice)d8,damageType=fire,saveRemove=false,saveDC=@attributes.spelldc,saveAbility=dex,saveDamage=nodamage,killAnim=true",
      priority: "20",
    },
  );
  effect.flags["ActiveAuras"] = {
    isAura: true,
    aura: "All",
    radius: null,
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
  foundry.utils.setProperty(effect, "duration.seconds", 60);
  foundry.utils.setProperty(effect, "duration.rounds", 10);
  effect.changes.push(DDBMacros.generateMacroChange({ macroType: "generic", macroName: DDBMacros.MACROS.ACTIVE_AURAS.AA_DAMAGE_ON_ENTRY.file }));
  DDBMacros.setMidiOnUseMacroFlag(document, "generic", DDBMacros.MACROS.ACTIVE_AURAS.AA_DAMAGE_ON_ENTRY.file, ["preActiveEffects"]);

  document.effects.push(effect);

  foundry.utils.setProperty(document, "flags.ddbimporter.effect", {
    dice: document.system.damage.parts[0][0],
    damageType: document.system.damage.parts[0][1],
    save: document.system.save.ability,
    sequencerFile: "jb2a.flames.01.orange",
    sequencerScale: 2,
    isCantrip: true,
    saveOnEntry: true,
  });

  return document;
}
