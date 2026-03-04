import DDBEnricherData from "../../data/DDBEnricherData";

export default class RageOfTheWilds extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.NONE;
  }

  get activity() {
    return {
      targetType: "self",
      name: "Owl",
      activationType: "special",
    };
  }

  get additionalActivities(): IDDBAdditionalActivity[] {
    return ["Bear", "Eagle", "Wolf"].map((name) => {
      return {
        init: {
          name,
          type: DDBEnricherData.ACTIVITY_TYPES.UTILITY,
        },
        build: {
          generateTarget: true,
          generateActivation: true,
          activationOverride: {
            type: "special",
          },
          targetOverride: {
            affects: {
              type: "self",
            },
          },
        },
      };
    });
  }

  get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Bear",
        options: {
        },
        activityMatch: "Bear",
        changes: DDBEnricherData.allDamageTypes(["force", "necrotic", "psychic", "radiant"]).map((damage) => {
          return DDBEnricherData.ChangeHelper.damageResistanceChange(damage);
        }),
      },
      {
        name: "Eagle",
        options: {
        },
        activityMatch: "Eagle",
        changes: [
        ],
      },
      {
        name: "Wolf",
        options: {
          description: `Allies have Advantage on attack rolls against your enemies within 5 ft .`,
        },
        activityMatch: "Wolf",
        changes: [
        ],
      },
    ];
  }

}
