import DDBBaseEnricher from "./DDBBaseEnricher.js";

export default class DDDFeatureEnricher extends DDBBaseEnricher {
  constructor({ document, name = null }) {
    super({ document, name });
    this._prepare();
  }

  NAME_HINTS = {};

  ACTIVITY_HINTS = {
    "Hold Breath": {
      type: "utility",
      func: undefined,
      targetSelf: true,
      specialActivation: true,
    },
    "Partially Amphibious": {
      type: "utility",
      func: undefined,
      targetSelf: true,
      specialActivation: true,
      addItemConsume: true,
    },
    "Second Wind": {
      type: "heal",
      func: undefined,
      addItemConsume: true,
      targetSelf: true,
      data: {
        healing: {
          number: 1,
          denomination: 10,
          bonus: "@classes.fighter.levels",
          types: ["healing"],
          scaling: {
            mode: "whole",
            number: null,
            formula: "",
          },
        },
      },
    },
  };

  DOCUMENT_OVERRIDES = {
    "Action Surge": {
      removeDamage: true,
    },
    "Arcane Propulsion Armor Gauntlet": {
      data: {
        "system.damage.bonus": "@mod",
      },
    },
    "Partially Amphibious": {
      data: {
        "system.uses": {
          spent: 0,
          max: "1",
          recovery: [
            {
              period: "lr",
              type: "recoverAll",
            },
          ],
        },
        "flags.midiProperties.toggleEffect": true,
      },
    },
  };

  EFFECT_HINTS = {
    "Hold Breath": {
      type: "feat",
      data: {
        "duration.rounds": 600,
      },
    },
    "Partially Amphibious": {
      type: "feat",
      data: {
        "duration.rounds": 600,
      },
    },
  };
}
