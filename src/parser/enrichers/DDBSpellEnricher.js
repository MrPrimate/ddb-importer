import DDBSpellActivity from "../spells/DDBSpellActivity.js";
import DDBBaseEnricher from "./DDBBaseEnricher.js";

export default class DDDSpellEnricher extends DDBBaseEnricher {
  constructor({ document, name = null } = {}) {
    super({ document, name });
    this._prepare();
    this.additionalActivityClass = DDBSpellActivity;
  }

  static basicDamagePart({
    number = null, denomination = null, type = null, bonus = "", scalingMode = "whole",
    scalingNumber = 1, scalingFormula = "",
  } = {}) {
    return {
      number,
      denomination,
      bonus,
      types: type ? [type] : [],
      custom: {
        enabled: false,
        formula: "",
      },
      scaling: {
        mode: scalingMode, // whole, half or ""
        number: scalingNumber,
        formula: scalingFormula,
      },
    };
  }

  NAME_HINTS = {};

  ADDITIONAL_ACTIVITIES = {
    "Toll the Dead": [
      {
        constructor: {
          name: "Save (D12 Damage)",
          type: "save",
        },
        build: {
          generateDamage: true,
          damageParts: [DDDSpellEnricher.basicDamagePart({ number: 1, denomination: 12, type: "necrotic" })],
        },
      },
    ],
  };

  ACTIVITY_HINTS = {
    "Scorching Ray": {
      parent: [{
        lookupName: "Circlet of Blasting",
        flatAttack: "5",
      }],
    },
  };

  DOCUMENT_OVERRIDES = {

  };

  EFFECT_HINTS = {

  };
}
