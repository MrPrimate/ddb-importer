import { baseSpellEffect, generateStatusEffectChange } from "../specialSpells.js";
import { loadMacroFile, generateMacroChange, generateItemMacroFlag, MACROS } from "../macros.js";
import { effectModules } from "../effects.js";

export async function blackTentaclesEffect(document) {
  if (!effectModules().activeAurasInstalled) {
    let effect = baseSpellEffect(document, document.name);
    effect.changes.push(generateStatusEffectChange("Restrained"));
    document.effects.push(effect);

    return document;
  }


  let effect = baseSpellEffect(document, document.name);
  const itemMacroText = await loadMacroFile(MACROS.AA_ON_ENTRY.type, MACROS.AA_ON_ENTRY.file);
  document = generateItemMacroFlag(document, itemMacroText);
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
  effect.changes.push(generateMacroChange(""));
  setProperty(document, "flags.midi-qol.onUseMacroName", "[preActiveEffects]ItemMacro");

  const aaMacroFlags = {
    applyStart: true,
    handleStartRoll: true,
    autoDamageIfCondition: true,
    applyEnd: false,
    applyEntry: true,
    applyImmediate: true,
    everyEntry: false,
    conditionEffect: true,
    damageEffect: true,
    removeOnOff: true,
    allowVsRemoveCondition: true,
    removalCheck: ["str", "dex"],
    removalSave: null,
    saveRemoves: false,
    condition: "Restrained",
    dice: document.system.damage.parts[0][0],
    damageType: document.system.damage.parts[0][1],
    save: document.system.save.ability,
    sequencerFile: "jb2a.black_tentacles.dark_purple",
  };
  setProperty(document, "flags.ddbimporter.effect", aaMacroFlags);
  setProperty(effect, "flags.ddbimporter.effect", aaMacroFlags);
  setProperty(document, "flags.midiProperties.nodam", true);

  document.effects.push(effect);
  return document;

}
