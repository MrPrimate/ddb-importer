import { baseFeatEffect, featEffectModules } from "../specialFeats.js";
import { generateStatusEffectChange, generateATLChange } from "../effects.js";
import { loadMacroFile, generateMacroChange, generateItemMacroFlag } from "../macros.js";
import logger from "../../logger.js";
import utils from "../../utils.js";

export async function runeCarverEffect(ddb, character, document) {

  // If a rune requires a saving throw, your Rune Magic save DC equals 8 + your proficiency bonus + your Constitution modifier.

  //const dcString = "8 + @prof + @attributes.con.mod";

  let baseEffect = baseFeatEffect(document, document.name);
  setProperty(document, "data.target.type", "self");
  setProperty(document, "data.range.units", "");
  setProperty(document, "data.range.value", null);

  const name = document.flags.ddbimporter.originalName || document.name;

  switch (name) {
    case "Cloud Rune": {
      baseEffect.transfer = true;
      baseEffect.changes.push(
        {
          key: "flags.midi-qol.advantage.skill.dec",
          mode: CONST.ACTIVE_EFFECT_MODES.ADD,
          value: "1",
          priority: "20",
        },
        {
          key: "flags.midi-qol.advantage.skill.slt",
          mode: CONST.ACTIVE_EFFECT_MODES.ADD,
          value: "1",
          priority: "20",
        },
      );
      // Missing: reaction effect to transfer attack
      break;
    }
    case "Fire Rune": {
      baseEffect.changes.push(generateStatusEffectChange("Restrained"));
      baseEffect.changes.push(
        {
          key: "flags.midi-qol.OverTime",
          mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
          value: `label=${document.name} (Start of Turn Damage),turn=start,savingThrow=false,damageRoll=${document.data.damage.parts[0][0]}, damageType=${document.data.damage.parts[0][1]}`,
          priority: "20",
        },
        {
          key: "flags.midi-qol.OverTime",
          mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
          value: `label=${document.name} (End of Turn Save),turn=end,saveDC=@attributes.spelldc,saveAbility=${document.data.save.ability},savingThrow=true,saveMagic=true,saveRemove=true`,
          priority: "20",
        }
      );
      setProperty(baseEffect, "duration.seconds", 60);
      setProperty(document, "data.target.value", 1);
      setProperty(document, "data.target.type", "creature");
      // Missing: prof bonus expertise for tool
      break;
    }
    case "Frost Rune": {
      baseEffect.transfer = true;
      baseEffect.changes.push(
        {
          key: "flags.midi-qol.advantage.skill.ani",
          mode: CONST.ACTIVE_EFFECT_MODES.ADD,
          value: "1",
          priority: "20",
        },
        {
          key: "flags.midi-qol.advantage.skill.itm",
          mode: CONST.ACTIVE_EFFECT_MODES.ADD,
          value: "1",
          priority: "20",
        },
      );

      let bonusEffect = baseFeatEffect(document, `${document.name} (Sturdiness)`);
      bonusEffect.changes.push(
        {
          key: "data.abilities.con.bonuses.check",
          mode: CONST.ACTIVE_EFFECT_MODES.ADD,
          value: "+2",
          priority: "20",
        },
        {
          key: "data.abilities.con.bonuses.save",
          mode: CONST.ACTIVE_EFFECT_MODES.ADD,
          value: "+2",
          priority: "20",
        },
        {
          key: "data.abilities.str.bonuses.check",
          mode: CONST.ACTIVE_EFFECT_MODES.ADD,
          value: "+2",
          priority: "20",
        },
        {
          key: "data.abilities.str.bonuses.save",
          mode: CONST.ACTIVE_EFFECT_MODES.ADD,
          value: "+2",
          priority: "20",
        },
      );
      setProperty(bonusEffect, "duration.seconds", 600);
      document.effects.push(bonusEffect);
      break;
    }
    case "Stone Rune": {
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

      let bonusEffect = baseFeatEffect(document, `${document.name} (Sturdiness)`);
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
      setProperty(bonusEffect, "duration.seconds", 60);
      setProperty(document, "data.target.value", 1);
      setProperty(document, "data.target.type", "creature");
      setProperty(document, "data.range.units", "ft");
      setProperty(document, "data.range.value", 30);
      // Missing:
      break;
    }
    // no default
  }

  // TODO:
  // Hill Rune
  // Storm Rune

  document.effects.push(baseEffect);
  return document;
}
