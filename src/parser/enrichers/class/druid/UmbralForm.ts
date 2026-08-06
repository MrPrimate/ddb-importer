import DDBEnricherData from "../../data/DDBEnricherData";

export default class UmbralForm extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  get activity(): IDDBActivityData {
    return {
      targetType: "self",
      activationType: "bonus",
      addItemConsume: true,
      itemConsumeTargetName: "Wild Shape",
      data: {
        range: {
          units: "self",
        },
        duration: {
          value: "10",
          units: "minute",
        },
      },
    };
  }

  get additionalActivities(): IDDBAdditionalActivity[] {
    if (this.isAction) return [];
    return [
      {
        init: {
          name: "Umbral Retaliation",
          type: DDBEnricherData.ACTIVITY_TYPES.DAMAGE,
        },
        build: {
          generateConsumption: false,
          generateTarget: true,
          generateRange: false,
          generateActivation: true,
          generateDamage: true,
          activationOverride: {
            type: "reaction",
            value: 1,
            condition: "A creature you can see hits you with a melee attack",
          },
        },
        overrides: {
          data: {
            damage: {
              parts: [
                DDBEnricherData.basicDamagePart({
                  customFormula: "@prof",
                  types: ["cold"],
                }),
              ],
            },
          },
        },
      },
    ];
  }

  get effects(): IDDBEffectHint[] {
    if (this.isAction) return [];
    return [
      {
        name: "Umbral Form",
        options: {
          durationSeconds: 600,
          description: "While in dim light or darkness you can take the Hide action as a Bonus Action, and you can move through a space as narrow as 1 inch wide without squeezing.",
        },
      },
    ];
  }

}
