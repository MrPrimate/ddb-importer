import { baseSpellEffect } from "../specialSpells.js";
import DDBMacros from "../DDBMacros.js";
import { effectModules, generateTokenMagicFXChange } from "../effects.js";

export async function faerieFireEffect(document) {
  let effect = baseSpellEffect(document, document.name);
  effect.changes.push({
    key: "flags.midi-qol.grants.advantage.attack.all",
    mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM,
    value: "1",
    priority: "20",
  });

  if (game.modules.get("ATL")?.active) {
    await DDBMacros.setItemMacroFlag(document, "spell", "faerieFire.js");
    effect.changes.push(DDBMacros.generateMacroChange({ macroType: "spell", macroName: "faerieFire.js" }));
  }

  if (effectModules().tokenMagicInstalled) {
    effect.changes.push(generateTokenMagicFXChange("glow"));
  }

  document.effects.push(effect);

  return document;
}
