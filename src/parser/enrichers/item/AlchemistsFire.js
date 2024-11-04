/* eslint-disable class-methods-use-this */
import DDBEnricherMixin from "../DDBEnricherMixin.js";

export default class AlchemistsFire extends DDBEnricherMixin {

  get type() {
    return this.is2014
      ? "attack"
      : "save";
  }

  get activity() {
    if (this.is2014) {
      return {
        addItemConsume: true,
        targetType: "creature",
        data: {
          attack: {
            ability: "dex",
            type: {
              value: "ranged",
              classification: "weapon",
            },
          },
        },
      };
    } else {
      return {
        addItemConsume: true,
        targetType: "creature",
        data: {
          save: {
            ability: "dex",
            dc: {
              calculation: "dex",
              formula: "",
            },
          },
        },
      };
    }
  }

  get additionalActivities() {
    if (this.is2014) {
      return [
        {
          constructor: {
            name: "Extinguish Flames Check",
            type: "check",
          },
          build: {
            generateCheck: true,
            checkOverride: {
              associated: [],
              ability: "dex",
              dc: {
                calculation: "",
                formula: "10",
              },
            },
          },
        },
      ];
    }
    return null;

  }

  get override() {
    if (this.is2014) {
      return {
        options: {
          transfer: false,
          description: "You are on fire, take [[/damage 1d4 fire]] at the start of your turn. You can use an action to distinguish with a [[/check dex 10]].",
        },
      };
    } else {
      return {
        data: {
          "system.uses.autoDestroy": false,
        },
      };
    }

  }

  get effects() {
    if (this.is2014) return [];

    return [{
      statuses: ["Burning"],
      options: {
        transfer: false,
        description: "You are &Reference[Burning] take [[/damage 1d4 fire]] at the start of your turn.",
      },
    }];
  }

}
