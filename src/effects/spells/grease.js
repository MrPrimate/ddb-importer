import { baseSpellEffect, generateStatusEffectChange } from "../specialSpells.js";
import { loadMacroFile, generateMacroChange, generateItemMacroFlag, MACROS } from "../macros.js";
import { effectModules } from "../effects.js";

export async function greaseEffect(document) {

  if (!effectModules().activeAurasInstalled) {
    let effect = baseSpellEffect(document, document.name);
    effect.changes.push(generateStatusEffectChange("Prone"));
    document.effects.push(effect);

    return document;
  }

  // if we have active auras use a more advanced macro
  let effect = baseSpellEffect(document, document.name);
  // effect.changes.push(generateStatusEffectChange("Prone", 20, true));
  effect.changes.push(
    {
      key: "flags.midi-qol.OverTime",
      mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM,
      value: `turn=end,label=${document.name},saveRemove=false,saveDC=@attributes.spelldc,saveAbility=dex,saveDamage=nodamage,killAnim=true,macro=${MACROS.AA_CONDITION_ON_ENTRY.name}`,
      priority: "20",
    },
  );

  const itemMacroText = await loadMacroFile(MACROS.AA_CONDITION_ON_ENTRY.type, MACROS.AA_CONDITION_ON_ENTRY.file);
  document.flags["itemacro"] = generateItemMacroFlag(document, itemMacroText);
  setProperty(document, "flags.midi-qol.onUseMacroName", "[preActiveEffects]ItemMacro");
  effect.changes.push(generateMacroChange("@item.level @attributes.spelldc"));

  // effect.changes.push(generateMacroChange("@item.level @attributes.spelldc"));
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
  setProperty(effect, "duration.seconds", 60);
  // setProperty(effect, "flags.dae.macroRepeat", "startEveryTurn");
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
  setProperty(document, "flags.ddbimporter.effect", aaMacroFlags);
  setProperty(effect, "flags.ddbimporter.effect", aaMacroFlags);

  document.effects.push(effect);

  return document;
}
