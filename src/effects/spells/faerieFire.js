import { baseSpellEffect, generateTokenMagicFXChange } from "../specialSpells.js";
import DDBMacros from "../macros.js";
import { effectModules } from "../effects.js";

export async function faerieFireEffect(document) {
  let effect = baseSpellEffect(document, document.name);
  effect.changes.push({
    key: "flags.midi-qol.grants.advantage.attack.all",
    mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM,
    value: "1",
    priority: "20",
  });

  if (game.modules.get("ATL")?.active) {
    const itemMacroText = await DDBMacros.loadMacroFile("spell", "faerieFire.js");
    document = DDBMacros.generateItemMacroFlag(document, itemMacroText);
    effect.changes.push(DDBMacros.generateMacroChange(""));
  }

  if (effectModules().tokenMagicInstalled) {
    effect.changes.push(generateTokenMagicFXChange("glow"));
  }

  document.effects.push(effect);

  return document;
}
