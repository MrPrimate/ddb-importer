import Generic from "../Generic";
export default class SlayersPrey extends Generic {

  get addAutoAdditionalActivities() {
    return true;
  }

  get activity(): IDDBActivityData {
    return {
      name: "Apply",
    };
  }

  get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Bonus Damage",
          type: Generic.ACTIVITY_TYPES.DAMAGE,
        },
        build: {
          generateDamage: true,
          generateTarget: true,
          generateRange: true,
        },
        overrides: {
          targetType: "enemy",
          activationType: "special",
          data: {
            damage: {
              parts: [
                Generic.basicDamagePart({
                  number: 1,
                  denomination: 6,
                  types: Generic.allDamageTypes(),
                }),
              ],
            },
            range: {
              units: "spec",
            },
          },
        },
      },
    ];
  }

}
