import DDBFeatureActivity from "../features/DDBFeatureActivity.js";
import DDBBaseEnricher from "./DDBBaseEnricher.js";

export default class DDDFeatureEnricher extends DDBBaseEnricher {
  constructor({ ddbParser, document, name = null } = {}) {
    super({ ddbParser, document, name });
    this._prepare();
    this.additionalActivityClass = DDBFeatureActivity;
  }

  DND_2014 = {
    NAME_HINTS: {},
    ACTIVITY_HINTS: {},
    ADDITIONAL_ACTIVITIES: {},
    DOCUMENT_OVERRIDES: {},
    EFFECT_HINTS: {},
    DOCUMENT_STUB: {},
  };

  NAME_HINTS = {};

  ACTIVITY_HINTS = {
    "Hold Breath": {
      type: "utility",
      func: undefined,
      targetType: "self",
      activationType: "special",
    },
    "Partially Amphibious": {
      type: "utility",
      func: undefined,
      targetType: "self",
      activationType: "special",
      addItemConsume: true,
    },
    "Second Wind": {
      type: "heal",
      func: undefined,
      addItemConsume: true,
      targetType: "self",
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
    "Drake Companion": {
      data: {
        "system.uses.max": "",
        "system.uses.recovery": [],
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

  DOCUMENT_STUB = {

  };
}
