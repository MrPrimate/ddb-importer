import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * Divination: two foretelling d20s after each long rest, three from wizard level 14 (Greater
 * Portent). The uses count the dice left; one activity rolls the dice, the other spends one to
 * replace a roll.
 */
export default class Portent extends DDBEnricherData {

  static DICE = "2 + floor(@classes.wizard.levels / 14)";

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Replace Roll",
      targetType: "creature",
      activationType: "special",
      activationCondition: "Before an attack roll, saving throw or ability check by you or a creature you can see, once per turn",
      addItemConsume: true,
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Roll Foretelling Dice",
          type: DDBEnricherData.ACTIVITY_TYPES.UTILITY,
        },
        build: {
          generateConsumption: false,
          generateTarget: true,
          generateActivation: true,
          generateRoll: true,
          rollOverride: {
            name: "Foretelling Rolls",
            formula: `(${Portent.DICE})d20`,
            prompt: false,
            visible: true,
          },
          activationOverride: {
            type: "longRest",
            value: 1,
            condition: "When you finish a Long Rest",
          },
        },
        overrides: {
          targetSelf: true,
        },
      },
    ];
  }

  override get override(): IDDBOverrideData {
    return {
      uses: this._getUsesWithSpent({
        type: "class",
        name: "Portent",
        max: Portent.DICE,
        period: "lr",
      }),
    };
  }

}
