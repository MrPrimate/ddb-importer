import DDBEnricherData from "../data/DDBEnricherData";

export default class SpeedyRecovery extends DDBEnricherData {
  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.NONE;
  }

  get additionalActivities() {
    return ["Smallest", "Largest"].map((size) => {
      return {
        init: {
          name: `Healing - ${size} Hit Die`,
          type: "heal",
        },
        build: {
          generateConsumption: true,
          generateTarget: false,
          targetSelf: true,
          generateRange: false,
          generateActivation: true,
          generateDamage: false,
          generateHealing: true,
          activationOverride: {
            type: "bonus",
          },
          healingPart: DDBEnricherData.basicDamagePart({
            customFormula: `@attributes.hd.${size.toLowerCase()}Available`,
            type: "healing",
          }),
          consumptionOverride: {
            targets: [
              {
                type: "hitDice",
                target: size.toLowerCase(),
                value: 1,
                scaling: {
                  mode: "",
                  formula: "",
                },
              },
            ],
            scaling: {
              allowed: false,
              max: "",
            },
          },
        },
      };
    });
  }
}
