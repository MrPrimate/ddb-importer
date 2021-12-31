import { baseSpellEffect } from "../specialSpells.js";

export function holyAuraEffect(document) {
  let effectHolyAuraHolyAuras = baseSpellEffect(document, document.name);
  effectHolyAuraHolyAuras.changes.push(
    {
      key: "flags.midi-qol.advantage.ability.save.all",
      mode: CONST.ACTIVE_EFFECT_MODES.ADD,
      value: "1",
      priority: "20",
    },
    {
      key: "flags.midi-qol.grants.disadvantage.attack.all",
      mode: CONST.ACTIVE_EFFECT_MODES.ADD,
      value: "1",
      priority: "20",
    },
    { key: "ATL.dimLight", mode: CONST.ACTIVE_EFFECT_MODES.UPGRADE, value: "5", priority: "20" }
  );
  document.effects.push(effectHolyAuraHolyAuras);

  return document;
}
