import { baseSpellEffect } from "../specialSpells.js";
import DDBMacros from "../DDBMacros.js";
import { effectModules, addStatusEffectChange } from "../effects.js";

export async function blackTentaclesEffect(document) {
  if (!effectModules().activeAurasInstalled || !effectModules().midiQolInstalled) {
    let effect = baseSpellEffect(document, `${document.name} - Restrained`);
    addStatusEffectChange(effect, "Restrained", 20, true);
    document.effects.push(effect);

    return document;
  }

  let effect = baseSpellEffect(document, document.name);
  await DDBMacros.setItemMacroFlag(document, "generic", DDBMacros.MACROS.ACTIVE_AURAS.AA_ON_ENTRY.file);
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
    save: "str",
    savedc: null,
    displayTemp: true,
  };
  foundry.utils.setProperty(effect, "duration.seconds", 60);
  foundry.utils.setProperty(effect, "flags.dae.macroRepeat", "startEveryTurn");
  effect.changes.push(DDBMacros.generateMacroChange({ macroType: "generic", macroName: DDBMacros.MACROS.ACTIVE_AURAS.AA_ON_ENTRY.file }));
  DDBMacros.setMidiOnUseMacroFlag(document, "generic", DDBMacros.MACROS.ACTIVE_AURAS.AA_ON_ENTRY.file, ["preActiveEffects"]);

  const aaMacroFlags = {
    applyStart: true,
    handleStartRoll: true,
    autoDamageIfCondition: true,
    applyEnd: false,
    applyEntry: true,
    applyImmediate: false,
    everyEntry: false,
    conditionEffect: true,
    damageEffect: true,
    removeOnOff: true,
    allowVsRemoveCondition: true,
    removalCheck: ["str", "dex"],
    removalSave: null,
    saveRemoves: false,
    condition: "Restrained",
    dice: `${document.system.damage.parts[0][0]}`,
    damageType: `${document.system.damage.parts[0][1]}`,
    save: `${document.system.save.ability}`,
    sequencerFile: "jb2a.black_tentacles.dark_purple",
  };
  foundry.utils.setProperty(document, "flags.ddbimporter.effect", aaMacroFlags);
  foundry.utils.setProperty(effect, "flags.ddbimporter.effect", aaMacroFlags);
  // foundry.utils.setProperty(document, "flags.midiProperties.nodam", true);
  document.system.damage = { parts: [], versatile: "", value: "" };
  document.system.save.ability = "";
  document.system.actionType = "other";

  document.effects.push(effect);
  return document;

}
