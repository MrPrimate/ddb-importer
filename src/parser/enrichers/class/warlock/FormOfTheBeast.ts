import DDBEnricherData from "../../data/DDBEnricherData";

export default class FormOfTheBeast extends DDBEnricherData {

  override get type() {
    return DDBEnricherData.ACTIVITY_TYPES.HEAL;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Transform",
      activationType: "bonus",
      targetType: "self",
      addItemConsume: true,
      data: {
        healing: DDBEnricherData.basicDamagePart({
          bonus: "min(20, @classes.warlock.levels*2)",
          types: ["temphp"],
        }),
      },
    };
  }

  override get effects(): IDDBEffectHint[] {
    return [{
      name: "Form of the Beast",
      activityMatch: "Transform",
      options: {
        durationSeconds: 600,
      },
      changes: [
        DDBEnricherData.ChangeHelper.advantageSkillChange("prc"),
        DDBEnricherData.ChangeHelper.advantageSkillChange("ste"),
        DDBEnricherData.ChangeHelper.advantageSkillChange("sur"),
      ],
    }];
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Bite",
          type: DDBEnricherData.ACTIVITY_TYPES.ATTACK,
        },
        build: {
          generateTarget: true,
          generateRange: true,
          generateAttack: true,
          generateDamage: true,
          generateActivation: true,
          generateDuration: true,
          durationOverride: {
            units: "inst",
          },
          activationOverride: {
            type: "action",
          },
        },
        overrides: {
          targetType: "creature",
          data: {
            attack: {
              ability: "",
              bonus: "max(@abilities.str.mod, @abilities.cha.mod)",
              type: {
                value: "ranged",
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
                  bonus: "max(@abilities.str.mod, @abilities.cha.mod)",
                  type: "piercing",
                }),
              ],
            },
          },
        },
      },
      {
        init: {
          name: "Claw",
          type: DDBEnricherData.ACTIVITY_TYPES.ATTACK,
        },
        build: {
          generateTarget: true,
          generateRange: true,
          generateAttack: true,
          generateDamage: true,
          generateActivation: true,
          generateDuration: true,
          durationOverride: {
            units: "inst",
          },
          activationOverride: {
            type: "bonus",
          },
        },
        overrides: {
          targetType: "creature",
          data: {
            attack: {
              ability: "",
              bonus: "max(@abilities.str.mod, @abilities.cha.mod)",
              type: {
                value: "ranged",
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
                  denomination: 4,
                  bonus: "max(@abilities.str.mod, @abilities.cha.mod)",
                  type: "slashing",
                }),
              ],
            },
          },
        },
      },
    ];
  }

  override get override(): IDDBOverrideData {
    return {
      uses: this._getUsesWithSpent({
        type: "class",
        name: "Form of the Beast",
        max: "2",
        period: "sr",
      }),
    };
  }

}
