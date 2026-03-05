import DDBEnricherData from "../data/DDBEnricherData";

export default class AlchemistsFire extends DDBEnricherData {

  get type() {
    return this.is2014
      ? DDBEnricherData.ACTIVITY_TYPES.ATTACK
      : DDBEnricherData.ACTIVITY_TYPES.SAVE;
  }

  get activity(): IDDBActivityData {
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
            ability: ["dex"],
            dc: {
              calculation: "dex",
              formula: "",
            },
          },
        },
      };
    }
  }

  get additionalActivities(): IDDBAdditionalActivity[] {
    if (this.is2014) {
      return [
        {
          init: {
            name: "Extinguish Flames Check",
            type: DDBEnricherData.ACTIVITY_TYPES.CHECK,
          },
          build: {
            generateCheck: true,
            checkOverride: {
              associated: [],
              ability: ["dex"],
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

  get override(): IDDBOverrideData {
    if (this.is2014) {
      return null;
    } else {
      return {
        uses: {
          autoDestroy: false,
        },
      };
    }

  }

  get effects(): IDDBEffectHint[] {
    if (this.is2014) return [{
      options: {
        transfer: false,
        description: "You are on fire, take [[/damage 1d4 fire]] at the start of your turn. You can use an action to distinguish with a [[/check dex 10]].",
      },
    }];

    return [{
      statuses: ["Burning"],
      options: {
        transfer: false,
        description: "You are &Reference[Burning] take [[/damage 1d4 fire]] at the start of your turn.",
      },
    }];
  }

}
