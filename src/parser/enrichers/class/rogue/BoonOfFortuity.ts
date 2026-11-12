import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * Fortune Rogue (OTFY). Each Long Rest rolls the fortuitous d20s (two, three from The Skin of Your
 * Teeth, from the hand-built fortuitous-rolls scale); each one spent replaces a save DC once per turn.
 * The uses track the unspent rolls and the recorded numbers are read from the rest chat card.
 */
export default class BoonOfFortuity extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Roll Fortuitous Rolls",
      activationType: "longRest",
      activationCondition: "When you finish a Long Rest",
      noConsumeTargets: true,
      targetType: "self",
      data: {
        roll: {
          prompt: false,
          visible: true,
          formula: `(@scale.${this.subclassIdentifier("Fortune Rogue")}.fortuitous-rolls)d20`,
          name: "Fortuitous Rolls",
        },
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Replace Save DC",
          type: DDBEnricherData.ACTIVITY_TYPES.UTILITY,
        },
        build: {
          generateConsumption: true,
          generateTarget: true,
          generateActivation: true,
        },
        overrides: {
          name: "Replace Save DC",
          activationType: "special",
          activationCondition: "An effect created by a creature you can see forces a saving throw (once per turn)",
          addItemConsume: true,
          targetType: "self",
        },
      },
    ];
  }

  override get override(): IDDBOverrideData {
    return {
      uses: this._getUsesWithSpent({
        type: "class",
        name: "Boon of Fortuity",
        max: `@scale.${this.subclassIdentifier("Fortune Rogue")}.fortuitous-rolls`,
        period: "lr",
      }),
    };
  }

}
