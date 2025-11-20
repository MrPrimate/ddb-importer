/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class MantleOfMajesty extends DDBEnricherData {
  get type() {
    return "utility";
  }

  get activity() {
    return {
      name: "Activate Mantle of Majesty",
      addItemConsume: true,
      activationType: "bonus",
      data: {
        duration: {
          "concentration": true,
          "override": true,
        },
      },
    };
  }

  get additionalActivities() {
    const results = [
      {
        constructor: {
          name: "Cast Command",
          type: "cast",
        },
        build: {
          generateConsumption: false,
          generateSpell: true,
        },
        overrides: {
          noConsumeTargets: true,
          addSpellUuid: "Command",
          activationType: "bonus",
          data: {
            duration: {
              "value": "1",
              "units": "minute",
              "special": "",
              "concentration": true,
              "override": true,
            },
            spell: {
              spellbook: false,
            },
          },
        },
      },

    ];

    if (this.is2024) {
      results.push(
        {
          constructor: {
            name: "Spend Spell Slot to Restore Use",
            type: "utility",
          },
          build: {
            generateConsumption: true,
            generateTarget: true,
            generateActivation: true,
            generateUtility: true,
            activationOverride: {
              type: "none",
              value: null,
              condition: "",
            },
            consumptionOverride: {
              scaling: { allowed: true, max: "7" },
              targets: [
                {
                  type: "itemUses",
                  target: "",
                  value: -1,
                  scaling: { mode: "", formula: "" },
                },
                {
                  type: "spellSlots",
                  value: "1",
                  target: "3",
                  scaling: { allowed: false, max: "" },
                },
              ],
            },
          },
        },
      );
    }
    return results;
  }

  get effects() {
    return [
      {
        name: "Mantle of Majesty",
        activityMatch: "Activate Mantle of Majesty",
      },
    ];
  }

  get override() {
    const uses = this._getUsesWithSpent({
      type: "class",
      name: "Mantle of Majesty",
      max: "1",
      period: "lr",
    });
    return {
      data: {
        system: {
          uses,
        },
      },
    };
  }

}
