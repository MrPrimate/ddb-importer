import { baseSpellEffect } from "../specialSpells.js";
import DDBMacros from "../DDBMacros.js";
import { effectModules } from "../effects.js";

export async function stormSphereEffect(document) {
  // we require active auras for this effect
  if (!effectModules().activeAurasInstalled) return document;

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
        "turn=end,label=Storm Sphere (End of Turn),damageRoll=(@item.level - 2)d6,damageType=bludgeoning,saveRemove=false,saveDC=@attributes.spelldc,saveAbility=str,saveDamage=nodamage,killAnim=true",
      priority: "20",
    }
  );
  await DDBMacros.setItemMacroFlag(document, "spell", "stormSphere.js");
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
  foundry.utils.setProperty(effect, "duration.seconds", 60);
  foundry.utils.setProperty(effect, "flags.dae.macroRepeat", "startEveryTurn");
  effect.changes.push(DDBMacros.generateMacroChange({ macroType: "spell", macroName: "stormSphere.js" }));
  DDBMacros.setMidiOnUseMacroFlag(document, "spell", "stormSphere.js", ["preActiveEffects"]);

  document.effects.push(effect);

  const damageOne = foundry.utils.duplicate(document.system.damage.parts[0]);
  const damageTwo = foundry.utils.duplicate(document.system.damage.parts[1]);
  document.system.damage = { parts: [damageOne], versatile: "", value: "" };
  document.system.formula = damageTwo[0];
  document.system.actionType = "save";

  return document;
}
