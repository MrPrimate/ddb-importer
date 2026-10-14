import DDBEnricherData from "../../data/DDBEnricherData";

export default class SteelDefender extends DDBEnricherData {

  override get activity(): IDDBActivityData {
    if (this.is2014) {
      return {
        noConsumeTargets: true,
        noTemplate: true,
      };
    } else {
      return {
        targetType: "self",
        noConsumeTargets: true,
        noTemplate: true,
        data: {
          bonuses: {
            "ac": "@abilities.int.mod",
            "hp": "@classes.artificer.levels * 5",
            "attackDamage": "@abilities.int.mod",
            "healing": "@abilities.int.mod",
          },
        },
      };
    }
  }

  // a defender that died within the last hour returns to life when you spend a spell slot (level 1+)
  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Revive Defender",
          type: DDBEnricherData.ACTIVITY_TYPES.UTILITY,
        },
        build: {
          generateConsumption: false,
          generateTarget: true,
          generateActivation: true,
          generateUtility: true,
          activationOverride: { type: "action", value: 1, condition: "The defender died within the last hour" },
        },
        overrides: {
          targetType: "creature",
          noTemplate: true,
          data: {
            range: { units: "touch" },
            consumption: {
              scaling: { allowed: true, max: "9" },
              targets: [
                { type: "spellSlots", value: "1", target: "1", scaling: { mode: "level", formula: "" } },
              ],
            },
          },
        },
      },
    ];
  }

  override get override(): IDDBOverrideData {
    return {
      uses: {
        spent: null,
        max: "",
        recovery: [],
      },
    };
  }

}
