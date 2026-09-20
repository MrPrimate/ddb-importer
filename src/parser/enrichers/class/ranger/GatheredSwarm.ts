import DDBEnricherData from "../../data/DDBEnricherData";

export default class GatheredSwarm extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.DAMAGE;
  }

  get activity(): IDDBActivityData {
    return {
      name: "Extra Damage",
      activationType: "special",
      targetType: "creature",
      func: ({ activity }: { activity: IActivityData }) => {
        for (const part of activity.damage?.parts ?? []) {
          part.types = ["piercing"];
        }
      },
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
          generateSave: true,
          saveOverride: { ability: ["str"], dc: { calculation: "spellcasting", formula: "" } },
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

  get override(): IDDBOverrideData {
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
