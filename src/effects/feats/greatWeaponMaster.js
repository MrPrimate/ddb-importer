import { baseEffect } from "../effects.js";

export function greatWeaponMasterEffect(document) {
  let effect = baseEffect(document, document.name, { transfer: false });

  effect.changes.push(
    {
      key: "system.bonuses.mwak.attack",
      value: "-5",
      mode: CONST.ACTIVE_EFFECT_MODES.ADD,
      priority: 30,
    },
    {
      key: "system.bonuses.mwak.damage",
      value: "+10",
      mode: CONST.ACTIVE_EFFECT_MODES.ADD,
      priority: 30,
    },
  );
  setProperty(effect, "flags.dae.showIcon", true);
  document.effects.push(effect);

  document.system.activation = {
    "type": "none",
    "cost": 1,
    "condition": ""
  };

  document.system["target"]["type"] = "self";
  document.system.range = { value: null, units: "self", long: null };
  document.system.actionType = "other";

  const midiFlags = {
    "effectActivation": false,
    // "forceCEOff": false,
    // "forceCEOn": true,
    "removeAttackDamageButtons": "default",
  };

  setProperty(document, "flags.midi-qol", midiFlags);
  setProperty(document, "flags.midiProperties.toggleEffect", true);

  return document;
}
