import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * Sidereal Cabal level 3. Darkvision is DDB's modifier (the auto effect stays) and the skill grant
 * an advancement; Mini-Portent rolls the foretold d20 after each Long Rest.
 */
export default class StarlitSight extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Mini-Portent",
      activationType: "special",
      activationCondition: "When you finish a Long Rest; the roll can replace one D20 Test by you or a creature you can see, chosen before the roll",
      targetType: "self",
      rangeSelf: true,
      addItemConsume: true,
      data: {
        roll: {
          prompt: false,
          visible: true,
          formula: "1d20",
          name: "Foretold Roll",
        },
      },
    };
  }

  override get override(): IDDBOverrideData {
    return {
      uses: this._getUsesWithSpent({
        type: "class",
        name: "Starlit Sight: Mini-Portent",
        max: "1",
        period: "lr",
      }),
    };
  }

}
