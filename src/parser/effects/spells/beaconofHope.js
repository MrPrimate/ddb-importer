import { baseSpellEffect } from "../specialSpells.js";

export function beaconofHopeEffect(document) {
  let effectBeaconofHopeBeaconofHope = baseSpellEffect(document, document.name);
  effectBeaconofHopeBeaconofHope.changes.push(
    {
      key: "flags.midi-qol.advantage.ability.save.wis",
      value: "1",
      mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
      priority: 20,
    },
    { key: "flags.midi-qol.advantage.deathSave", value: "1", mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE, priority: 20 }
  );
  document.effects.push(effectBeaconofHopeBeaconofHope);

  return document;
}
