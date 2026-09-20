import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * Gift of the Protectors: the Book of Shadows page holds up to max(1, Cha) names, so the item
 * uses count the names written. Write Name spends a slot, Erase Name gives it back, and Protect
 * is the trigger when a named creature drops to 0 hit points. Both printings share the shape.
 */
export default class EldritchInvocationsGiftOfTheProtectors extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Protect",
      activationType: "special",
      activationCondition: "When a creature whose name is on the page is reduced to 0 Hit Points but not killed outright; it drops to 1 Hit Point instead and its name is erased",
      targetType: "creature",
      targetCount: 1,
      rangeSelf: true,
      noConsumeTargets: true,
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Write Name",
          type: DDBEnricherData.ACTIVITY_TYPES.UTILITY,
        },
        build: {
          generateActivation: true,
          generateTarget: true,
          generateRange: true,
          generateConsumption: true,
          generateUtility: true,
          activationOverride: {
            type: "action",
            value: 1,
            condition: "A creature touches the page and writes its name",
          },
        },
        overrides: {
          targetType: "creature",
          targetCount: 1,
          rangeSelf: true,
          addItemConsume: true,
        },
      },
      {
        init: {
          name: "Erase Name",
          type: DDBEnricherData.ACTIVITY_TYPES.UTILITY,
        },
        build: {
          generateActivation: true,
          generateTarget: true,
          generateRange: true,
          generateConsumption: true,
          generateUtility: true,
          activationOverride: {
            type: "action",
            value: 1,
            condition: "",
          },
        },
        overrides: {
          rangeSelf: true,
          addItemConsume: true,
          itemConsumeValue: "-1",
        },
      },
    ];
  }

  override get override(): IDDBOverrideData {
    return {
      uses: this._getUsesWithSpent({
        type: "class",
        name: this.ddbParser.originalName,
        max: "max(1, @abilities.cha.mod)",
        period: "",
      }),
    };
  }

}
