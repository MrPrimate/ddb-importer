import DDBEnricherData from "../../data/DDBEnricherData";

export default class QuiveringPalm extends DDBEnricherData {

  override get useDefaultAdditionalActivities(): boolean {
    return this.is2014;
  }

  override get type(): IDDBActivityType | null {
    return this.is2024 ? DDBEnricherData.ACTIVITY_TYPES.SAVE : null;
  }

  override get activity(): IDDBActivityData | null {
    if (!this.is2024) return null;
    return {
      name: "End Vibrations",
      activationType: "action",
      targetType: "creature",
      targetCount: 1,
      rangeSelf: true,
      // the DDB action carries the 4 Focus Point cost; that belongs on Instill Vibrations only
      noConsumeTargets: true,
      data: {
        damage: {
          onSave: "half",
          parts: [
            DDBEnricherData.basicDamagePart({
              number: 10,
              denomination: 12,
              types: ["force"],
            }),
          ],
        },
        save: {
          ability: ["con"],
          dc: {
            calculation: "wis",
            formula: "",
          },
        },
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    if (!this.is2024) return [];
    return [
      {
        init: {
          name: "Instill Vibrations",
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
            condition: "When you hit a creature with an Unarmed Strike; the vibrations last until the end of your next Long Rest",
          },
        },
        overrides: {
          targetType: "creature",
          targetCount: 1,
          rangeSelf: true,
          addItemConsume: true,
          itemConsumeTargetName: "Monk's Focus",
          itemConsumeValue: 4,
        },
      },
    ];
  }

}
