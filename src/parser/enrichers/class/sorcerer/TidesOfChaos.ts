import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * Tides of Chaos: one use per long rest either way, but the 2024 printing regains the use when
 * a levelled sorcerer spell is cast (and forces a Wild Magic Surge), so it gets a second
 * activity that restores a use instead of spending one.
 */
export default class TidesOfChaos extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      name: this.is2024 ? "Expend for Advantage" : "Tides of Chaos",
      activationType: "special",
      activationCondition: "Before you make a D20 Test",
      targetType: "self",
      rangeSelf: true,
      addItemConsume: true,
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    if (!this.is2024) return [];
    return [
      {
        init: {
          name: "Recharge from Spell",
          type: DDBEnricherData.ACTIVITY_TYPES.UTILITY,
        },
        build: {
          generateActivation: true,
          generateTarget: true,
          generateRange: true,
          generateConsumption: true,
          generateUtility: true,
          activationOverride: {
            type: "special",
            value: null,
            condition: "When you cast a Sorcerer spell with a spell slot while Tides of Chaos is expended; you then roll on the Wild Magic Surge table",
          },
        },
        overrides: {
          targetType: "self",
          rangeSelf: true,
          addItemConsume: true,
          itemConsumeValue: "-1",
        },
      },
    ];
  }

}
