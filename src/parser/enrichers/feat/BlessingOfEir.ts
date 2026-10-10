import DDBEnricherData from "../data/DDBEnricherData";

/** Blessing of Eir: Vitality Points (proficiency bonus per long rest) buy a 1d4 self heal or a 1d4 heal by touch, each a bonus action, or a stabilize while dying. */
export default class BlessingOfEir extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.HEAL;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Vitality Surge",
      targetType: "self",
      activationType: "bonus",
      addItemConsume: true,
      data: {
        healing: DDBEnricherData.basicDamagePart({ number: 1, denomination: 4, types: ["healing"] }),
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: { name: "Channel Vitality", type: DDBEnricherData.ACTIVITY_TYPES.HEAL },
        build: {
          generateConsumption: true,
          generateTarget: true,
          generateActivation: true,
          generateHealing: true,
          generateRange: true,
          activationOverride: { type: "bonus", value: 1, condition: "" },
          healingPart: DDBEnricherData.basicDamagePart({ number: 1, denomination: 4, types: ["healing"] }),
        },
        overrides: { targetType: "creature", targetCount: 1, addItemConsume: true, data: { range: { override: true, units: "touch" } } },
      },
      {
        init: { name: "Stabilize", type: DDBEnricherData.ACTIVITY_TYPES.UTILITY },
        build: { generateConsumption: true, generateTarget: true, generateActivation: true, activationOverride: { type: "special", value: 1, condition: "You are Dying (no action required)" } },
        overrides: { targetSelf: true, addItemConsume: true },
      },
    ];
  }

}
