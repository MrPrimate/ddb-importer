import { baseFeatEffect } from "../specialFeats.js";
import { generateATLChange, effectModules } from "../effects.js";
import DDBMacros from "../DDBMacros.js";

export async function runeCarverEffect(document) {

  let baseEffect = baseFeatEffect(document, document.name, { transfer: true });

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
          key: "system.attributes.senses.darkvision",
          value: "120",
          mode: CONST.ACTIVE_EFFECT_MODES.UPGRADE,
          priority: 20,
        },
      );
      if (effectModules().atlInstalled) {
        baseEffect.changes.push(
          generateATLChange("ATL.sight.range", CONST.ACTIVE_EFFECT_MODES.UPGRADE, 120, 5),
          generateATLChange("ATL.sight.visionMode", CONST.ACTIVE_EFFECT_MODES.OVERRIDE, "darkvision", 5),
        );
      } else {
        await DDBMacros.setItemMacroFlag(document, "feat", "darkvision.js");
        baseEffect.changes.push(DDBMacros.generateMacroChange({ macroType: "spell", macroName: "darkvision.js" }));
      }
      break;
    }
    case "Rune Carver: Hill Rune": {
      baseEffect.changes.push(
        {
          key: "system.traits.dr.value",
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
    foundry.utils.setProperty(document, "system.target.type", "self");
    foundry.utils.setProperty(document, "system.range.units", "self");
    foundry.utils.setProperty(document, "system.range.value", "");
    foundry.utils.setProperty(document, "system.actionType", null);
    document.effects.push(baseEffect);
  }
  return document;
}
