import DDBEnricherData from "../data/DDBEnricherData";

export default class AlchemistsFire extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return this.is2014
      ? DDBEnricherData.ACTIVITY_TYPES.ATTACK
      : DDBEnricherData.ACTIVITY_TYPES.SAVE;
  }

  // primaryOnly keeps the throw's cost and attack off the parser's turn-start Damage activity
  override get activity(): IDDBActivityData {
    if (this.is2014) {
      return {
        primaryOnly: true,
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
        primaryOnly: true,
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

  override get additionalActivities(): IDDBAdditionalActivity[] | null {
    if (this.is2014) {
      return [
        {
          init: {
            name: "Extinguish Flames Check",
            type: DDBEnricherData.ACTIVITY_TYPES.CHECK,
          },
          build: {
            generateCheck: true,
            generateConsumption: false,
            checkOverride: {
              associated: [],
              ability: "dex",
              dc: {
                calculation: "",
                formula: "10",
              },
            },
          },
          overrides: {
            noConsumeTargets: true,
          },
        },
      ];
    }
    return null;

  }

  // throwing takes a flask from the stack, and the last one stays at quantity 0 so the follow-up
  // activities (the 2024 region's burning, the 2014 damage and extinguish check) are still on the item
  override get override(): IDDBOverrideData {
    return { spendOwnQuantity: true };
  }

  override get effects(): IDDBEffectHint[] {
    if (this.is2014) {
      return [{
        name: "Alchemist's Fire: Burning",
        options: {
          transfer: false,
          description: "You are on fire, take [[/damage 1d4 fire]] at the start of your turn. You can use an action to distinguish with a [[/check dex 10]].",
        },
      }];
    }

    return [{
      name: "Alchemist's Fire: Burning",
      statuses: ["Burning"],
      options: {
        transfer: false,
        description: "You are &Reference[Burning] take [[/damage 1d4 fire]] at the start of your turn.",
      },
    }];
  }

}
