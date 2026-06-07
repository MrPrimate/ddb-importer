import DDBEnricherData from "../../data/DDBEnricherData";

export default class FormOfDread extends DDBEnricherData {
  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.HEAL;
  }

  get activity(): IDDBActivityData {
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
          addActivityConsume: true,
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
            uses: {
              max: "1",
              spent: 0,
              recovery: [{ period: "turnStart", type: "recoverAll", formula: undefined }],
            },
          },
        },
      },
    ];
  }

  get override(): IDDBOverrideData {
    return {
      uses: this._getUsesWithSpent({
        type: "class",
        name: "Form of Dread: Transform",
        max: "@prof",
        period: "lr",
      }),
    };
  }

  get clearAutoEffects() {
    return true;
  }

  get effects(): IDDBEffectHint[] {
    const baseEffects = [
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
    if (this.is2024) {
      baseEffects.push(
        {
          name: "Form of Dread: Superior Dread",
          activityMatch: "Transform",
          options: {
            durationSeconds: 60,
          },
          changes: [
            DDBEnricherData.ChangeHelper.unsignedAddChange("bludgeoning", 20, "system.traits.dr.value"),
            DDBEnricherData.ChangeHelper.unsignedAddChange("slashing", 20, "system.traits.dr.value"),
            DDBEnricherData.ChangeHelper.unsignedAddChange("piercing", 20, "system.traits.dr.value"),
            DDBEnricherData.ChangeHelper.upgradeChange("@attributes.movement.walk", 2, "system.attributes.movement.fly"),
            DDBEnricherData.ChangeHelper.overrideChange("true", 2, "system.attributes.movement.hover"),
          ],
          data: {
            flags: {
              ddbimporter: {
                effectIdLevel: {
                  min: 14,
                },
              },
            },
          },
        },
      );
    }
    return baseEffects;
  }
}
