/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../data/DDBEnricherData.mjs";

export default class CacophonicShield extends DDBEnricherData {

  get type() {
    return "utility";
  }

  get activity() {
    return {
      name: "Cast",
      targetType: "self",
      data: {
      },
    };
  }

  get additionalActivities() {
    return [
      {
        constructor: {
          name: "Save vs Damage and Deafness",
          type: "save",
        },
        build: {
          generateSave: true,
          generateActivation: true,
          generateDamage: true,
        },
        overrides: {
          activationType: "special",
        },
      },
    ];
  }

  get clearAutoEffects() {
    return true;
  }


  get effects() {
    return [
      {
        activityMatch: "Save vs Damage and Deafness",
        name: "Deafness",
        options: {
          durationRounds: 1,
          durationSeconds: null,
        },
        statuses: ["Deafness"],
        daeSpecialDurations: ["turnStartSource"],
      },
      {
        name: "Shielded",
        options: {
          durationSeconds: 600,
          durationRounds: 60,
        },
        changes: [
          DDBEnricherData.ChangeHelper.addChange("thunder", 20, "system.traits.dr.value"),
        ],
        midiChanges: [
          DDBEnricherData.ChangeHelper.unsignedAddChange("1", 20, "flags.midi-qol.disadvantage.attack.rwak"),
        ],
      },
      {
        name: "Cacophic Shield Aura",
        options: {},
        data: {
          flags: {
            ddbimporter: {
              activityMatch: "Cast",
            },
            ActiveAuras: {
              aura: "Enemies",
              radius: "10",
              isAura: true,
              ignoreSelf: true,
              inactive: false,
              hidden: false,
              displayTemp: true,
            },
          },
        },
        auraeffects: {
          applyToSelf: false,
          bestFormula: "",
          canStack: false,
          collisionTypes: ["move"],
          combatOnly: false,
          disableOnHidden: true,
          distanceFormula: "10",
          disposition: -1,
          evaluatePreApply: true,
          overrideName: "",
          script: "",
        },
      },
    ];
  }

}
