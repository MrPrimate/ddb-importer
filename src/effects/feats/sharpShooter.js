import { baseFeatEffect } from "../specialFeats.js";

export function sharpShooterEffect(document) {
  let effect = baseFeatEffect(document, `${document.name} - Range Adjustment`);

  effect.changes.push(
    // changes range
    {
      key: "flags.midi-qol.sharpShooter",
      value: "1",
      mode: CONST.ACTIVE_EFFECT_MODES.ADD,
      priority: 30,
    },
    {
      key: "flags.dnd5e.helpersIgnoreCover",
      value: "2",
      mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM,
      priority: 30,
    },
  );

  effect.transfer = true;
  // effect.flags.dae.selfTarget = true;
  effect.flags.dae.transfer = true;
  // setProperty(effect, "flags.core.statusId", true);

  document.effects.push(effect);
  document.data.activation = {
    "type": "none",
    "cost": 1,
    "condition": ""
  };

  document.data["target"]["type"] = "self";
  document.data.range = { value: null, units: "self", long: null };
  document.data.actionType = "other";

  const midiFlags = {
    "effectActivation": false,
    "forceCEOff": false,
    "forceCEOn": true
  };

  setProperty(document, "flags.midi-qol", midiFlags);

  const midiProperties = {
    "toggleEffect": true,
  };

  setProperty(document, "flags.midiProperties", midiProperties);

  return document;
}
