import { baseSpellEffect, generateTokenMagicFXChange } from "../specialSpells.js";
import utils from "../../../utils.js";

export function blessEffect(document) {
  let effect = baseSpellEffect(document, document.name);
  effect.changes.push(
    { key: "data.bonuses.abilities.save", value: "+1d4", mode: CONST.ACTIVE_EFFECT_MODES.ADD, priority: 20 },
    { key: "data.bonuses.All-Attacks", value: "+1d4", mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM, priority: 0 }
  );
  document.effects.push(effect);

  if (utils.isModuleInstalledAndActive("tokenmagic")) {
    effect.changes.push(generateTokenMagicFXChange("bloom"));
  }

  return document;
}
