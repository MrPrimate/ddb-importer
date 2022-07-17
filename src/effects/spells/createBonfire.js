import { baseSpellEffect, spellEffectModules } from "../specialSpells.js";
import { loadMacroFile, generateMacroChange, generateItemMacroFlag, MACROS } from "../macros.js";

export async function createBonfireEffect(document) {
  // we require active auras for this effect
  if (!spellEffectModules().activeAurasInstalled) return document;

  const itemMacroText = await loadMacroFile("generic", MACROS.AA_DAMAGE_ON_ENTRY.file);
  document.flags["itemacro"] = generateItemMacroFlag(document, itemMacroText);

  let effect = baseSpellEffect(document, document.name);
  effect.changes.push(
    {
      key: "flags.midi-qol.OverTime",
      mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM,
      value:
        "turn=start,label=Create Bonfire (Start of Turn),damageRoll=(@cantripDice)d8,damageType=fire,saveRemove=false,saveDC=@attributes.spelldc,saveAbility=dex,saveDamage=nodamage,killAnim=true",
      priority: "20",
    },
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
  setProperty(effect, "duration.seconds", 60);
  effect.changes.push(generateMacroChange(""));
  setProperty(document, "flags.midi-qol.onUseMacroName", "[preActiveEffects]ItemMacro");

  document.effects.push(effect);

  setProperty(document, "flags.ddbimporter.effect", {
    dice: document.data.damage.parts[0][0],
    damageType: document.data.damage.parts[0][1],
    save: document.data.save.ability,
    sequencerFile: "jb2a.flames.01.orange",
    isCantrip: true,
  });

  return document;
}
