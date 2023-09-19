import { baseSpellEffect } from "../specialSpells.js";
import DDBMacros from "../macros.js";

export async function heroismEffect(document) {
  let effect = baseSpellEffect(document, document.name);
  effect.changes.push({
    key: "system.traits.ci.value",
    value: "frightened",
    mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM,
    priority: 20,
  });
  effect.flags.dae.macroRepeat = "startEveryTurn";
  const itemMacroText = await DDBMacros.loadMacroFile("spell", "heroism.js");
  document = DDBMacros.generateItemMacroFlag(document, itemMacroText);
  effect.changes.push(DDBMacros.generateMacroChange("@damage", { priority: 0 }));
  document.effects.push(effect);

  return document;
}
