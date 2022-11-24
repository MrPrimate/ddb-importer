import { baseSpellEffect } from "../specialSpells.js";
import { loadMacroFile, generateItemMacroFlag } from "../macros.js";

export async function zephyrStrikeEffect(document) {
  let effect = baseSpellEffect(document, `${document.name}`);

  // macroToCall
  effect.changes.push(
    {
      key: "flags.midi-qol.optional.ZepyrStrike.macroToCall",
      mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM,
      value: "ItemMacro.Zephyr Strike",
      priority: "20",
    },
    {
      key: "flags.midi-qol.optional.ZepyrStrike.damage.mwak",
      mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM,
      value: `${document.system.damage.parts[0][0]}`,
      priority: "20",
    },
    {
      key: "flags.midi-qol.optional.ZepyrStrike.damage.rwak",
      mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM,
      value: `${document.system.damage.parts[0][0]}`,
      priority: "20",
    },
    {
      key: "flags.midi-qol.optional.ZepyrStrike.count",
      mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM,
      value: "1",
      priority: "20",
    },
    {
      key: "flags.midi-qol.optional.ZepyrStrike.label",
      mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM,
      value: "Gain Zephyr Strike damage bonus?",
      priority: "20",
    },
  );

  setProperty(effect, "flags.dae.selfTarget", true);
  setProperty(effect, "flags.dae.selfTargetAlways", true);
  setProperty(document, "system.actionType", "other");

  document.effects.push(effect);
  document.system.damage.parts = [];

  const itemMacroText = await loadMacroFile("spell", "zephyrStrike.js");
  setProperty(document, "flags.itemacro", generateItemMacroFlag(document, itemMacroText));

  return document;
}
