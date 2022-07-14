import { baseFeatEffect, featEffectModules } from "../specialFeats.js";
import { generateStatusEffectChange, generateATLChange } from "../effects.js";
import { loadMacroFile, generateMacroChange, generateItemMacroFlag } from "../macros.js";

export async function stoneRuneEffect(document) {
  let baseEffect = baseFeatEffect(document, document.name);

  setProperty(document, "data.target.value", 1);
  setProperty(document, "data.target.type", "creature");
  setProperty(document, "data.range.units", "ft");
  setProperty(document, "data.range.value", 30);

  baseEffect.transfer = true;
  baseEffect.changes.push(
    {
      key: "flags.midi-qol.advantage.skill.ins",
      mode: CONST.ACTIVE_EFFECT_MODES.ADD,
      value: "1",
      priority: "20",
    },
    {
      key: "data.attributes.senses.darkvision",
      value: "120",
      mode: CONST.ACTIVE_EFFECT_MODES.UPGRADE,
      priority: 20,
    },
  );
  if (featEffectModules().atlInstalled) {
    baseEffect.changes.push(generateATLChange("ATL.dimSight", CONST.ACTIVE_EFFECT_MODES.UPGRADE, 120, 5));
  } else {
    const itemMacroText = await loadMacroFile("spell", "darkvision.js");
    document.flags["itemacro"] = generateItemMacroFlag(document, itemMacroText);
    baseEffect.changes.push(generateMacroChange(""));
  }

  document.effects.push(baseEffect);

  let bonusEffect = baseFeatEffect(document, `${document.name} (Sturdiness)`);
  setProperty(bonusEffect, "duration.seconds", 60);
  bonusEffect.changes.push(generateStatusEffectChange("Charmed"));
  bonusEffect.changes.push(generateStatusEffectChange("Incapacitated"));
  bonusEffect.changes.push(
    {
      key: "flags.midi-qol.OverTime",
      mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
      value: `label=${document.name} (End of Turn Save),turn=end,saveDC=@attributes.spelldc,saveAbility=${document.data.save.ability},savingThrow=true,saveMagic=true,saveRemove=true`,
      priority: "20",
    }
  );

  document.effects.push(bonusEffect);

  return document;
}
