import { baseSpellEffect, generateTokenMagicFXChange } from "../specialSpells.js";
import utils from "../../../utils.js";

export function mirrorImageEffect(document) {
  let effect = baseSpellEffect(document, document.name);

  if (utils.isModuleInstalledAndActive("tokenmagic")) {
    effect.changes.push(generateTokenMagicFXChange("images"));
  }

  document.effects.push(effect);

  return document;
}
