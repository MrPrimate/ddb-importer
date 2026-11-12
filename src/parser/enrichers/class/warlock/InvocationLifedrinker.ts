import DDBEnricherData from "../../data/DDBEnricherData";

export default class InvocationLifedrinker extends DDBEnricherData {
  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.DAMAGE;
  }

  override get activity(): IDDBActivityData {
    return {
      targetType: "creature",
      activationType: "special",
      activationCondition: "When you hit a creature with your pact weapon",
      // DDB's action spends a Hit Die; only the 2024 healing does
      noConsumeTargets: true,
      data: {
        damage: {
          parts: [
            this.is2014
              ? DDBEnricherData.basicDamagePart({ customFormula: "max(1, @abilities.cha.mod)", types: ["necrotic"] })
              : DDBEnricherData.basicDamagePart({
                number: 1,
                denomination: 6,
                types: ["necrotic", "psychic", "radiant"],
              }),
          ],
        },
      },
    };
  }

  // the 2014 invocation is only the extra damage
  override get additionalActivities(): IDDBAdditionalActivity[] {
    if (this.is2014) return [];
    return ["Smallest", "Largest"].map((size) => {
      return {
        init: {
          name: `Healing - ${size} Hit Die`,
          type: DDBEnricherData.ACTIVITY_TYPES.HEAL,
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
            type: "special",
            value: 1,
            condition: "Once per turn when you hit a creature with your pact weapon",
          },
          healingPart: DDBEnricherData.basicDamagePart({
            customFormula: `@consumed.hd + (max(1,@abilities.con.mod))`,
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
