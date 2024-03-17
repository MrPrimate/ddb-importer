import { baseSpellEffect } from "../specialSpells.js";
import DDBMacros from "../DDBMacros.js";
import { addStatusEffectChange, effectModules } from "../effects.js";

export async function greaseEffect(document) {

  if (!effectModules().activeAurasInstalled || !effectModules().midiQolInstalled) {
    let effect = baseSpellEffect(document, `${document.name} - Prone`);
    addStatusEffectChange(effect, "Prone", 20, true);
    document.effects.push(effect);

    return document;
  }

  // if we have active auras use a more advanced macro
  let effect = baseSpellEffect(document, document.name);
  effect.changes.push(
    {
      key: "flags.midi-qol.OverTime",
      mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM,
      value: `turn=end,label=${document.name},saveRemove=false,saveDC=@attributes.spelldc,saveAbility=dex,saveDamage=nodamage,killAnim=true,macro=${DDBMacros.MACROS.ACTIVE_AURAS.AA_CONDITION_ON_ENTRY.name}`,
      priority: "20",
    },
  );

  await DDBMacros.setItemMacroFlag(document, "generic", DDBMacros.MACROS.ACTIVE_AURAS.AA_CONDITION_ON_ENTRY.file);
  DDBMacros.setMidiOnUseMacroFlag(document, "generic", DDBMacros.MACROS.ACTIVE_AURAS.AA_CONDITION_ON_ENTRY.file, ["preActiveEffects"]);
  effect.changes.push(DDBMacros.generateMacroChange({ macroValues: "@item.level @attributes.spelldc", macroType: "generic", macroName: DDBMacros.MACROS.ACTIVE_AURAS.AA_CONDITION_ON_ENTRY.file }));

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
  // foundry.utils.setProperty(effect, "flags.dae.macroRepeat", "startEveryTurn");
  const aaMacroFlags = {
    applyStart: true,
    applyEnd: true,
    applyEntry: true,
    applyImmediate: true,
    everyEntry: true,
    removeOnOff: false,
    allowVsRemoveCondition: false,
    removalCheck: null,
    removalSave: null,
    saveRemoves: false,
    condition: "Prone",
    save: document.system.save.ability,
    sequencerFile: "jb2a.grease.dark_green.loop",
  };
  foundry.utils.setProperty(document, "flags.ddbimporter.effect", aaMacroFlags);
  foundry.utils.setProperty(effect, "flags.ddbimporter.effect", aaMacroFlags);

  document.effects.push(effect);

  return document;
}
