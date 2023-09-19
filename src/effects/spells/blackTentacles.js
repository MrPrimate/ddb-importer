import { baseSpellEffect, generateStatusEffectChange } from "../specialSpells.js";
import DDBMacros from "../macros.js";
import { effectModules } from "../effects.js";

export async function blackTentaclesEffect(document) {
  if (!effectModules().activeAurasInstalled) {
    let effect = baseSpellEffect(document, document.name);
    effect.changes.push(generateStatusEffectChange("Restrained"));
    document.effects.push(effect);

    return document;
  }


  let effect = baseSpellEffect(document, document.name);
  const itemMacroText = await DDBMacros.loadMacroFile("generic", DDBMacros.MACROS.ACTIVE_AURAS.AA_ON_ENTRY.file);
  document = DDBMacros.generateItemMacroFlag(document, itemMacroText);
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
  setProperty(effect, "duration.seconds", 60);
  setProperty(effect, "flags.dae.macroRepeat", "startEveryTurn");
  effect.changes.push(DDBMacros.generateMacroChange(""));
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
  setProperty(document, "flags.ddbimporter.effect", aaMacroFlags);
  setProperty(effect, "flags.ddbimporter.effect", aaMacroFlags);
  // setProperty(document, "flags.midiProperties.nodam", true);
  document.system.damage = { parts: [], versatile: "", value: "" };
  document.system.save.ability = "";
  document.system.actionType = "other";

  document.effects.push(effect);
  return document;

}
