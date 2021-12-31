import { baseSpellEffect } from "../specialSpells.js";

export function divineFavorEffect(document) {
  let effectDivineFavorDivineFavor = baseSpellEffect(document, document.name);
  effectDivineFavorDivineFavor.changes.push(
    { key: "data.bonuses.mwak.damage", value: "1d4[Radiant]", mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM, priority: 0 },
    { key: "data.bonuses.rwak.damage", value: "1d4[Radiant]", mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM, priority: 0 }
  );
  document.effects.push(effectDivineFavorDivineFavor);

  return document;
}
