import { baseSpellEffect } from "../specialSpells.js";
import { loadMacroFile, generateMacroChange, generateItemMacroFlag } from "../macros.js";

export async function irresistibleDanceEffect(document) {
  let effect = baseSpellEffect(document, document.name);

  effect.changes.push({
    key: "flags.midi-qol.disadvantage.ability.save.str",
    mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM,
    value: "1",
    priority: "20",
  });
  effect.changes.push({
    key: "flags.midi-qol.disadvantage.attack.all",
    mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM,
    value: "1",
    priority: "20",
  });
  effect.changes.push({
    key: "flags.midi-qol.grants.advantage.attack.all ",
    mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM,
    value: "1",
    priority: "20",
  });

  effect.flags.dae.macroRepeat = "startEveryTurn";
  const itemMacroText = await loadMacroFile("spell", "irresistibleDance.js");
  document.flags["itemacro"] = generateItemMacroFlag(document, itemMacroText);
  effect.changes.push(generateMacroChange(""));
  document.effects.push(effect);

  return document;
}
