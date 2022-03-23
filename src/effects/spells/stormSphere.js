import { baseSpellEffect, spellEffectModules } from "../specialSpells.js";
import { loadMacroFile, generateMacroChange, generateItemMacroFlag } from "../macros.js";

export async function stormSphereEffect(document) {
  // we require active auras for this effect
  if (!spellEffectModules().activeAurasInstalled) return document;

  let effect = baseSpellEffect(document, document.name);
  effect.changes.push(
    {
      key: "flags.midi-qol.disadvantage.skill.prc",
      mode: CONST.ACTIVE_EFFECT_MODES.ADD,
      value: "0",
      priority: "20",
    },
    {
      key: "flags.midi-qol.OverTime",
      mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM,
      value:
        "turn=end,label=Storm Sphere,damageRoll=(@item.level - 2)d6,damageType=bludgeoning,saveRemove=false,saveDC=@attributes.spelldc,saveAbility=str,saveDamage=nodamage,killAnim=true",
      priority: "20",
    }
  );
  const itemMacroText = await loadMacroFile("spell", "stormSphere.js");
  document.flags["itemacro"] = generateItemMacroFlag(document, itemMacroText);
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
  setProperty(effect, "duration.minutes", 1);
  setProperty(effect, "flags.dae.macroRepeat", "startEveryTurn");
  effect.changes.push(generateMacroChange(""));
  setProperty(document, "flags.midi-qol.onUseMacroName", "[preActiveEffects]ItemMacro");

  document.effects.push(effect);

  const damageOne = duplicate(document.data.damage.parts[0]);
  const damageTwo = duplicate(document.data.damage.parts[1]);
  document.data.damage = { parts: [damageOne], versatile: "", value: "" };
  document.data.formula = damageTwo[0];
  document.data.actionType = "save";

  return document;
}
