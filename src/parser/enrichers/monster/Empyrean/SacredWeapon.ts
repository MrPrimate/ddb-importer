import DDBEnricherData from "../../data/DDBEnricherData";

export default class SacredWeapon extends DDBEnricherData {

  override get type() {
    return DDBEnricherData.ACTIVITY_TYPES.ATTACK;
  }

  override get activity(): IDDBActivityData {
    return {
      data: {
        damage: {
          parts: [
            DDBEnricherData.basicDamagePart({
              number: 6,
              denomination: 6,
              bonus: "@mod",
              types: ["force"],
            }),
          ],
        },
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Additional Damage",
          type: DDBEnricherData.ACTIVITY_TYPES.DAMAGE,
        },
        build: {
          generateDamage: true,
          generateTarget: true,
        },
        overrides: {
          activationType: "special",
          activationCondition: "Bypasses Resistance or Immunity",
          data: {
            damage: {
              parts: [
                DDBEnricherData.basicDamagePart({
                  bonus: "21",
                  types: ["force"],
                }),
              ],
            },
          },
        },
      },
    ];
  }

}
