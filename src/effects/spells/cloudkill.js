import { baseSpellEffect, spellEffectModules } from "../specialSpells.js";
import { loadMacroFile, generateMacroChange, generateItemMacroFlag } from "../macros.js";

export async function cloudkillEffect(document) {
  // we require active auras for this effect
  if (!spellEffectModules().activeAurasInstalled) return document;

  const itemMacroText = await loadMacroFile("spell", "cloudkill.js");
  document.flags["itemacro"] = generateItemMacroFlag(document, itemMacroText);

  let effect = baseSpellEffect(document, document.name);
  effect.changes.push(
    {
      key: "flags.midi-qol.OverTime",
      mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM,
      value:
        `turn=start, saveAbility=${document.data.save.ability}, saveDC=@attributes.spelldc, saveDamage=halfdamage, rollType=save, saveMagic=true, damageBeforeSave=false, damageRoll=(@item.level)d8, damageType=${document.data.damage.parts[0][1]}`,
      priority: "20",
    }
  );
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
    save: "str",
    savedc: null,
    displayTemp: true,
  };
  setProperty(effect, "duration.seconds", 600);
  setProperty(effect, "flags.dae.macroRepeat", "startEveryTurn");
  // effect.changes.push(generateMacroChange(`"${document.data.damage.parts[0][0]}" "${document.data.damage.parts[0][1]}" "${document.data.save.ability}" "@item.level"`));
  effect.changes.push(generateMacroChange("@item.level"));
  setProperty(document, "flags.midi-qol.onUseMacroName", "[preActiveEffects]ItemMacro,[postActiveEffects]ItemMacro");
  setProperty(document, "flags.ddbimporter.effect", {
    dice: document.data.damage.parts[0][0],
    damageType: document.data.damage.parts[0][1],
    save: document.data.save.ability,
  });

  document.effects.push(effect);
  document.data.damage = { parts: [], versatile: "", value: "" };
  document.data.actionType = "other";
  document.data.save.ability = "";

  return document;
}
