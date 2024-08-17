import DDBBaseDictionary from "./DDBBaseDictionary.js";


export default class DDDFeatureDictionary extends DDBBaseDictionary {

  NAME_HINTS = {
  };

  ACTIVITY_HINTS = {
    "Second Wind": {
      type: "heal",
      func: undefined,
    },
    "Hold Breath": {
      type: "utility",
      func: undefined,
      data: {
        "target.affects.type": "self",
        range: {
          value: null,
          units: "self",
          special: "",
        },
        activation: {
          type: "special",
          value: 1,
          condition: "",
        },
      },
    },
    "Partially Amphibious": {
      type: "utility",
      func: undefined,
      data: {
        "target.affects.type": "self",
        range: {
          value: null,
          units: "self",
          special: "",
        },
        activation: {
          type: "special",
          value: 1,
          condition: "",
        },
      },
    },
  };

  DOCUMENT_HINTS = {
    "Partially Amphibious": {
      data: {
        "system.uses": {
          spent: 0,
          max: "1",
          recovery: [{
            period: "lr",
            type: "recoverAll",
          }],
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
