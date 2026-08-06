import DDBEnricherData from "../../data/DDBEnricherData";

export default class DrainLife extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.ATTACK;
  }

  get activity(): IDDBActivityData {
    return {
      name: "Drain Life",
      targetType: "creature",
      activationType: "bonus",
      activationCondition: "You take the Attack or Magic action",
      data: {
        attack: {
          ability: "str",
          type: {
            value: "melee",
            classification: "unarmed",
          },
        },
        range: {
          value: "5",
          units: "ft",
        },
        damage: {
          parts: [
            DDBEnricherData.basicDamagePart({
              number: 1,
              denomination: 6,
              bonus: "@abilities.cha.mod",
              type: "necrotic",
            }),
          ],
        },
      },
    };
  }

  get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Empowered Drain",
          type: DDBEnricherData.ACTIVITY_TYPES.DAMAGE,
        },
        build: {
          generateDamage: true,
          generateTarget: true,
          generateRange: true,
          generateActivation: true,
          generateConsumption: true,
          activationOverride: {
            type: "special",
            condition: "You hit a creature with Drain Life; you regain Hit Points equal to the damage dealt",
          },
        },
        overrides: {
          targetType: "creature",
          data: {
            range: {
              value: "5",
              units: "ft",
            },
            damage: {
              parts: [
                DDBEnricherData.basicDamagePart({
                  customFormula: "(1 + @spells.pact.level)d8",
                  type: "necrotic",
                }),
              ],
            },
            consumption: {
              targets: [
                {
                  type: "attribute",
                  target: "spells.pact.value",
                  value: "1",
                  scaling: {
                    mode: "",
                    formula: "",
                  },
                },
              ],
            },
          },
        },
      },
    ];
  }

}
