import DDBEnricherData from "../../data/DDBEnricherData";

export default class FormOfDread extends DDBEnricherData {
  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.HEAL;
  }

  get activity() {
    return {
      name: "Transform",
      activationType: "bonus",
      targetType: "self",
      addItemConsume: true,
      data: {
        healing: DDBEnricherData.basicDamagePart({
          number: 1,
          denomination: 10,
          bonus: "@classes.warlock.levels",
          types: ["temphp"],
        }),
      },
    };
  }

  get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Save vs Frightened",
          type: DDBEnricherData.ACTIVITY_TYPES.SAVE,
        },
        build: {
          generateSave: true,
          generateDamage: false,
          generateRange: true,
          noSpellslot: true,
        },
        overrides: {
          noConsumeTargets: true,
          activationType: "special",
          noTemplate: true,
          data: {
            save: {
              ability: ["wis"],
              dc: {
                calculation: "spellcasting",
              },
            },
            range: {
              value: null,
              units: "spec",
            },
          },
        },
      },
    ];
  }

  get override() {
    return {
      uses: this._getUsesWithSpent({
        type: "class",
        name: "Form of Dread: Transform",
        max: "@prof",
        period: "lr",
      }),
    };
  }

  get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Form of Dread",
        activityMatch: "Transform",
        options: {
          durationSeconds: 60,
        },
        changes: [
          DDBEnricherData.ChangeHelper.unsignedAddChange("frighened", 20, "system.traits.ci.value"),
        ],
      },
      {
        name: "Form of Dread: Necrotic Husk",
        activityMatch: "Transform",
        options: {
          durationSeconds: 60,
        },
        changes: [
          DDBEnricherData.ChangeHelper.unsignedAddChange("frighened", 20, "system.traits.di.value"),
        ],
        data: {
          flags: {
            ddbimporter: {
              effectIdLevel: {
                min: 10,
              },
            },
          },
        },
      },
      {
        name: "Frightened",
        activityMatch: "Save vs Frightened",
        statuses: ["Frightened"],
        options: {
          durationSeconds: 12,
        },
        daeSpecialDurations: ["turnEndSource" as const],
      },
    ];
  }
}
