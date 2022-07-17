import { baseSpellEffect, spellEffectModules } from "../specialSpells.js";
import { loadMacroFile, generateMacroChange, generateItemMacroFlag, MACROS } from "../macros.js";

export async function incendiaryCloudEffect(document) {
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
        `label=${document.name} Turn End,turn=end, saveAbility=${document.data.save.ability}, saveDC=@attributes.spelldc, saveDamage=halfdamage, rollType=save, saveMagic=true, damageBeforeSave=false, damageRoll=(@item.level)d8, damageType=${document.data.damage.parts[0][1]}`,
      priority: "20",
    },
  );
  effect.changes.push(generateMacroChange("@item.level"));
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
  setProperty(effect, "duration.seconds", 60);
  // setProperty(effect, "flags.dae.macroRepeat", "startEveryTurn");
  setProperty(document, "flags.midi-qol.onUseMacroName", "[preActiveEffects]ItemMacro");
  setProperty(document, "flags.ddbimporter.effect", {
    dice: document.data.damage.parts[0][0],
    damageType: document.data.damage.parts[0][1],
    save: document.data.save.ability,
    sequencerFile: "jb2a.fumes.fire.orange",
  });

  document.effects.push(effect);
  return document;
}
