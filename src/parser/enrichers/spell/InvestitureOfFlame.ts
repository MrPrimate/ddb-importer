import DDBEnricherData from "../data/DDBEnricherData";

export default class InvestitureOfFlame extends DDBEnricherData {

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
            contiguous: false,
            type: "radius",
            size: "5",
            units: "ft",
          },
          affects: {
            type: "creature",
          },
        },
        behaviors: [
          DDBEnricherData.BehaviorHelper.activity({
            events: ["tokenEnter", "tokenTurnEnd"],
            activityName: "Aura Damage",
            // "The flames don't harm you"; the damage is for any creature that
            // moves within 5 feet OF YOU
            excludeSelf: true,
          }),
        ],
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Aura Damage",
          type: DDBEnricherData.ACTIVITY_TYPES.DAMAGE,
        },
        build: {
          generateDamage: true,
          generateActivation: true,
          generateConsumption: false,
          generateTarget: true,
          noSpellslot: true,
          activationOverride: {
            type: "special",
            condition: "Moves within 5 feet for the first time on a turn or ends its turn there",
          },
          targetOverride: {
            override: true,
            affects: {
              count: "1",
              type: "creature",
            },
            template: {},
          },
          damageParts: [
            DDBEnricherData.basicDamagePart({
              number: 1,
              denomination: 10,
              type: "fire",
            }),
          ],
        },
      },
      {
        init: {
          name: "Flame Line",
          type: DDBEnricherData.ACTIVITY_TYPES.SAVE,
        },
        build: {
          generateSave: true,
          generateDamage: true,
          generateActivation: true,
          generateConsumption: false,
          generateTarget: true,
          noSpellslot: true,
          onSave: "half",
          activationOverride: {
            type: "action",
          },
          targetOverride: {
            override: true,
            affects: {
              type: "creature",
            },
            template: {
              contiguous: false,
              type: "line",
              size: "15",
              width: "5",
              units: "ft",
            },
          },
          saveOverride: {
            ability: ["dex"],
            dc: {
              formula: "",
              calculation: "spellcasting",
            },
          },
          damageParts: [
            DDBEnricherData.basicDamagePart({
              number: 4,
              denomination: 8,
              type: "fire",
            }),
          ],
        },
      },
    ];
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Investiture of Flame",
        activityMatch: "Cast",
        changes: [
          DDBEnricherData.ChangeHelper.damageImmunityChange("fire"),
          DDBEnricherData.ChangeHelper.damageResistanceChange("cold"),
        ],
        options: {
          durationSeconds: 600,
        },
      },
    ];
  }

}
