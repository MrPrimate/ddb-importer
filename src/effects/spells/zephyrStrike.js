import { baseSpellEffect } from "../specialSpells.js";
import DDBMacros from "../DDBMacros.js";

export async function zephyrStrikeEffect(document) {
  let effect = baseSpellEffect(document, `${document.name}`);

  // macroToCall
  effect.changes.push(
    {
      key: "flags.midi-qol.optional.ZephyrStrike.macroToCall",
      mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM,
      value: DDBMacros.generateItemMacroValue({ macroType: "spell", macroName: "zephyrStrike.js", document }),
      priority: "20",
    },
    {
      key: "flags.midi-qol.optional.ZephyrStrike.damage.mwak",
      mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM,
      value: `${document.system.damage.parts[0][0]}`,
      priority: "20",
    },
    {
      key: "flags.midi-qol.optional.ZephyrStrike.damage.rwak",
      mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM,
      value: `${document.system.damage.parts[0][0]}`,
      priority: "20",
    },
    {
      key: "flags.midi-qol.optional.ZephyrStrike.count",
      mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM,
      value: "1",
      priority: "20",
    },
    {
      key: "flags.midi-qol.optional.ZephyrStrike.label",
      mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM,
      value: "Gain Zephyr Strike damage bonus?",
      priority: "20",
    },
    {
      key: "flags.midi-qol.optional.ZephyrStrike.criticalDamage",
      mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM,
      value: "1",
      priority: "20",
    },
  );

  document.system.target.type = "self";
  foundry.utils.setProperty(effect, "flags.dae.selfTarget", true);
  foundry.utils.setProperty(effect, "flags.dae.selfTargetAlways", true);
  foundry.utils.setProperty(document, "system.actionType", "other");

  document.effects.push(effect);
  document.system.damage.parts = [];

  await DDBMacros.setItemMacroFlag(document, "spell", "zephyrStrike.js");

  return document;
}
