import DDBEnricherData from "../../data/DDBEnricherData";

export default class BalmOfTheSummerCourt extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.HEAL;
  }

  get activity() {
    return {
      activationType: "bonus",
      addScalingMode: "amount",
      addItemConsume: true,
      addScalingFormula: "1",
      data: {
        "consumption.scaling": {
          allowed: true,
          max: "@classes.druid.levels",
        },
        healing: DDBEnricherData.basicDamagePart({
          number: 1,
          denomination: 6,
          types: ["healing"],
          scalingMode: "whole",
          scalingFormula: "1",
        }),
      },
    };
  }

  get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Temp HP",
          type: DDBEnricherData.ACTIVITY_TYPES.HEAL,
        },
        build: {
          generateConsumption: false,
          generateTarget: true,
          generateRange: false,
          generateActivation: true,
          generateDamage: false,
          generateHealing: true,
          activationOverride: {
            type: "special",
            value: 1,
            condition: "",
          },
          healingPart: DDBEnricherData.basicDamagePart({
            customFormula: "@scaling",
            type: "tempHP",
          }),
        },
        overrides: {
          data: {
            consumption: {
              scaling: {
                allowed: true,
                max: "@classes.druid.levels",
              },
              spellSlot: true,
              targets: [],
            },
          },
        },
      },
    ];
  }

  get override() {
    const uses = this._getUsesWithSpent({
      type: "class",
      name: "Balm of the Summer Court",
      max: "@classes.druid.levels",
      period: "lr",
    });

    return {
      retainOriginalConsumption: true,
      data: {
        system: {
          uses,
        },
      },
    };
  }

}

