import Generic from "../Generic";
export default class SlayersPrey extends Generic {

  override get addAutoAdditionalActivities(): boolean {
    return true;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Apply",
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
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

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Slayer's Prey (Automation)",
        ac5eOnly: true,
        options: {
          transfer: true,
          description: "Optional once per turn extra damage on the first weapon attack hit against your Slayer's Prey target. AC5e cannot check which creature is marked.",
        },
        ac5eChanges: [
          Generic.ChangeHelper.ac5eChange(
            "bonus=1d6; oncePerTurn; optin; actionType.mwak || actionType.rwak",
            20,
            "flags.automated-conditions-5e.damage.bonus",
          ),
        ],
      },
    ];
  }

}
