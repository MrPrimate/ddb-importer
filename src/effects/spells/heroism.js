import { baseSpellEffect } from "../specialSpells.js";
import DDBMacros from "../DDBMacros.js";

export async function heroismEffect(document) {
  let effect = baseSpellEffect(document, document.name);
  effect.changes.push({
    key: "system.traits.ci.value",
    value: "frightened",
    mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM,
    priority: 20,
  });
  effect.flags.dae.macroRepeat = "startEveryTurn";
  await DDBMacros.setItemMacroFlag(document, "spell", "heroism.js");
  effect.changes.push(DDBMacros.generateMacroChange({ macroValues: "@damage", macroType: "spell", macroName: "heroism.js", priority: 0 }));
  document.effects.push(effect);

  return document;
}
