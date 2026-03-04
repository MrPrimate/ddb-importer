import DDBEnricherData from "../../data/DDBEnricherData";

export default class GatheredSwarm extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.DAMAGE;
  }

  get activity() {
    return {
      name: "Extra Damage",
      activationType: "special",
      targetType: "creature",
    };
  }

  get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Save",
          type: DDBEnricherData.ACTIVITY_TYPES.SAVE,
        },
        build: {
          generateDamage: false,
        },
        overrides: {
          activationType: "special",
          targetType: "creature",
          data: {
            damage: {
              parts: [],
            },
          },
        },
      },
    ];
  }

  get override() {
    return {
      uses: {
        "spent": 0,
        "recovery": [
          {
            "period": "turnStart",
            "type": "recoverAll",
          },
        ],
        "max": "1",
      },
    };
  }
}
