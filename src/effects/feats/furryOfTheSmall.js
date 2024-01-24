import { baseFeatEffect } from "../specialFeats.js";
import DDBMacros from "../DDBMacros.js";

export async function furyOfTheSmallEffect(document) {
  await DDBMacros.setItemMacroFlag(document, "feat", "furyOfTheSmall.js");

  // let macroEffect = baseFeatEffect(document, `${document.name} (Size Checker)`, { transfer: true });
  DDBMacros.setMidiOnUseMacroFlag(document, "feat", "furyOfTheSmall.js", ["preDamageRoll"]);
  // document.effects.push(macroEffect);

  let effect = baseFeatEffect(document, document.name, { transfer: true });
  if (document.system.description.value.includes("once per turn")) {
    effect.changes.push(
      {
        key: "flags.midi-qol.optional.smallFury.damage.all",
        mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM,
        value: "(@prof)",
        priority: "20",
      },
      {
        key: "flags.midi-qol.optional.smallFury.label",
        mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM,
        value: `${document.name} (Only use on targets larger than you)`,
        priority: "20",
      },
      {
        key: "flags.midi-qol.optional.smallFury.count",
        mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM,
        value: "turn",
        priority: "20",
      },
      {
        key: "flags.midi-qol.optional.smallFury.countAlt",
        mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM,
        value: `ItemUses.${document.name}`,
        priority: "20",
      },
    );
  } else {
    effect.changes.push(
      {
        key: "flags.midi-qol.optional.smallFury.damage.all",
        mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM,
        value: "(@details.level)",
        priority: "20",
      },
      {
        key: "flags.midi-qol.optional.smallFury.label",
        mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM,
        value: `${document.name} (Only use on targets larger than you)`,
        priority: "20",
      },
      {
        key: "flags.midi-qol.optional.smallFury.count",
        mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM,
        value: `ItemUses.${document.name}`,
        priority: "20",
      },
    );
  }
  document.effects.push(effect);
  document.system.damage = {
    parts: [],
    versatile: "",
    value: "",
  };
  document.system.duration.units = "perm";
  document.system["target"]["type"] = "self";
  document.system.range = { value: null, units: "self", long: null };

  return document;
}
