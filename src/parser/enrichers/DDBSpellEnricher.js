import DDBSpellActivity from "../spells/DDBSpellActivity.js";
import DDBBaseEnricher from "./DDBBaseEnricher.js";

export default class DDDSpellEnricher extends DDBBaseEnricher {
  constructor({ ddbParser, document, name = null } = {}) {
    super({ ddbParser, document, name });
    this._prepare();
    this.additionalActivityClass = DDBSpellActivity;
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

  ADDITIONAL_ACTIVITIES = {
    "Toll the Dead": [
      {
        constructor: {
          name: "Save (D12 Damage)",
          type: "save",
        },
        build: {
          generateDamage: true,
          damageParts: [DDBBaseEnricher.basicDamagePart({ number: 1, denomination: 12, type: "necrotic" })],
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

  DOCUMENT_STUB = {

  };
}
