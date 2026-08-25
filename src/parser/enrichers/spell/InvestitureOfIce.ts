import DDBEnricherData from "../data/DDBEnricherData";

export default class InvestitureOfIce extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Cast",
      targetType: "self",
      data: {
        target: {
          override: true,
          template: {
            type: "radius",
            size: "10",
            units: "ft",
          },
          affects: {
            type: "creature",
          },
        },
        behaviors: [
          DDBEnricherData.BehaviorHelper.difficultTerrain({ types: ["ice"] }),
        ],
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Freezing Cone",
          type: DDBEnricherData.ACTIVITY_TYPES.SAVE,
        },
        build: {
          generateSave: true,
          generateDamage: true,
          generateConsumption: false,
          generateTarget: true,
          generateActivation: true,
          noSpellslot: true,
          onSave: "half",
          damageParts: [
            DDBEnricherData.basicDamagePart({
              number: 4,
              denomination: 6,
              type: "cold",
            }),
          ],
          targetOverride: {
            override: true,
            template: {
              type: "cone",
              size: "15",
              units: "ft",
            },
            affects: {
              type: "creature",
            },
          },
          activationOverride: {
            type: "action",
          },
          saveOverride: {
            ability: ["con"],
            dc: {
              formula: "",
              calculation: "spellcasting",
            },
          },
        },
      },
    ];
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Investiture of Ice",
        activityMatch: "Cast",
        changes: [
          DDBEnricherData.ChangeHelper.damageImmunityChange("cold"),
          DDBEnricherData.ChangeHelper.damageResistanceChange("fire"),
        ],
        options: {
          durationSeconds: 600,
        },
      },
      {
        name: "Investiture of Ice: Slowed",
        activityMatch: "Freezing Cone",
        changes: [
          DDBEnricherData.ChangeHelper.movementMultiplierChange("0.5", 20),
        ],
        data: {
          duration: {
            expiry: "turnStart",
          },
        },
      },
    ];
  }

}
