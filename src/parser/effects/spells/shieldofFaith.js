import { baseSpellEffect, generateTokenMagicFXChange } from "../specialSpells.js";
import utils from "../../../utils.js";

export function shieldofFaithEffect(document) {
  let effect = baseSpellEffect(document, document.name);
  effect.changes.push({
    key: "data.attributes.ac.bonus",
    mode: CONST.ACTIVE_EFFECT_MODES.ADD,
    value: "+2",
    priority: "20",
  });

  if (utils.isModuleInstalledAndActive("tokenmagic")) {
    effect.changes.push(generateTokenMagicFXChange("bloom"));
  }

  document.effects.push(effect);

  return document;
}
