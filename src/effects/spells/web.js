import { baseSpellEffect } from "../specialSpells.js";
import DDBMacros from "../DDBMacros.js";
import { effectModules, addStatusEffectChange } from "../effects.js";

export async function webEffect(document) {

  if (!effectModules().activeAurasInstalled || !effectModules().midiQolInstalled) {
    let effectWebRestrained = baseSpellEffect(document, `${document.name} - Restrained`);
    addStatusEffectChange(effectWebRestrained, "Restrained", 20, true);
    document.effects.push(effectWebRestrained);
    return document;
  }

  // if we have active auras use a more advanced macro
  await DDBMacros.setItemMacroFlag(document, "generic", DDBMacros.MACROS.ACTIVE_AURAS.AA_CONDITION_ON_ENTRY.file);

  let effect = baseSpellEffect(document, document.name);
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
  foundry.utils.setProperty(effect, "duration.seconds", 3600);
  foundry.utils.setProperty(effect, "flags.dae.macroRepeat", "startEveryTurn");
  DDBMacros.setMidiOnUseMacroFlag(document, "generic", DDBMacros.MACROS.ACTIVE_AURAS.AA_CONDITION_ON_ENTRY.file, ["preActiveEffects"]);

  foundry.utils.setProperty(document, "flags.ddbimporter.effect", {
    applyStart: true,
    applyEntry: true,
    applyImmediate: false,
    everyEntry: false,
    allowVsRemoveCondition: true,
    removalCheck: "str",
    removalSave: null,
    saveRemoves: false,
    condition: "Restrained",
    save: document.system.save.ability,
    // sequencerFile: "jb2a.web.02",
  });

  document.effects.push(effect);
  document.system.actionType = "other";
  document.system.save.ability = "";

  return document;
}
