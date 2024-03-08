import { baseEffect } from "../effects.js";

export function sharpShooterEffect(document) {
  let effect = baseEffect(document, document.name, { transfer: false });

  effect.changes.push(
    {
      key: "system.bonuses.rwak.attack",
      value: "-5",
      mode: CONST.ACTIVE_EFFECT_MODES.ADD,
      priority: 30,
    },
    {
      key: "system.bonuses.rwak.damage",
      value: "+10",
      mode: CONST.ACTIVE_EFFECT_MODES.ADD,
      priority: 30,
    },
  );

  setProperty(effect, "flags.dae.showIcon", true);

  document.effects.push(effect);

  let rageEffect = baseEffect(document, `${document.name} - Range Adjustment`, { transfer: true });

  rageEffect.changes.push(
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

  document.effects.push(rageEffect);
  document.system.activation = {
    "type": "none",
    "cost": 1,
    "condition": ""
  };

  document.system["target"]["type"] = "self";
  document.system.range = { value: null, units: "self", long: null };
  document.system.actionType = "other";

  setProperty(document, "flags.midi-qol.effectActivation", false);
  setProperty(document, "flags.midi-qol.removeAttackDamageButtons", false);
  setProperty(document, "flags.midiProperties.toggleEffect", true);

  return document;
}
