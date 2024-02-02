import { effectModules, generateTokenMagicFXChange } from "../effects.js";
import { baseSpellEffect } from "../specialSpells.js";

export function blurEffect(document) {
  let effect = baseSpellEffect(document, document.name);
  effect.changes.push(
    {
      key: 'flags.midi-qol.grants.disadvantage.attack.all',
      mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM,
      value: '1',
      priority: "20",
    }
  );

  if (effectModules().tokenMagicInstalled) {
    effect.changes.push(generateTokenMagicFXChange("blur"));
  }

  document.effects.push(effect);

  return document;
}
