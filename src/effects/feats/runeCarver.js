import { baseFeatEffect, featEffectModules } from "../specialFeats.js";
import { generateATLChange } from "../effects.js";
import { loadMacroFile, generateMacroChange, generateItemMacroFlag } from "../macros.js";

export async function runeCarverEffect(document) {

  let baseEffect = baseFeatEffect(document, document.name);
  baseEffect.transfer = true;

  switch (document.name) {
    case "Rune Carver: Cloud Rune": {
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
      break;
    }
    case "Rune Carver: Fire Rune": {
      // Missing: prof bonus expertise for tool
      break;
    }
    case "Rune Carver: Frost Rune": {
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
      break;
    }
    case "Rune Carver: Stone Rune": {
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
      break;
    }
    case "Rune Carver: Hill Rune": {
      baseEffect.changes.push(
        {
          key: "data.traits.dr.value",
          mode: CONST.ACTIVE_EFFECT_MODES.ADD,
          value: "poison",
          priority: "20",
        },
      );
      // Missing : advantage of saving throws against being poisoned
      break;
    }
    case "Rune Carver: Storm Rune": {
      baseEffect.changes.push(
        {
          key: "flags.midi-qol.advantage.skill.arc",
          mode: CONST.ACTIVE_EFFECT_MODES.ADD,
          value: "1",
          priority: "20",
        },
      );
      // Missing : can't be surprised

      break;
    }
    // no default
  }

  if (baseEffect.changes.length > 0) {
    setProperty(document, "data.target.type", "self");
    setProperty(document, "data.range.units", "self");
    setProperty(document, "data.range.value", "");
    setProperty(document, "data.actionType", null);
    document.effects.push(baseEffect);
  }
  return document;
}
