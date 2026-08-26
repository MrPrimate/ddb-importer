import DDBEnricherData from "../data/DDBEnricherData";

export default class SpiritGuardians extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Cast",
      data: {
        behaviors: [
          DDBEnricherData.BehaviorHelper.difficultTerrain(),
          DDBEnricherData.BehaviorHelper.activity({
            events: ["tokenEnter", this.is2014 ? "tokenTurnStart" : "tokenTurnEnd"],
            activityName: "Save vs Damage",
          }),
        ],
      },
    };
  }

  override get override(): IDDBOverrideData {
    return {
      data: {
        system: {
          target: {
            affects: {
              type: "enemy",
            },
            template: {
              type: "radius",
            },
          },
        },
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Save vs Damage",
          type: DDBEnricherData.ACTIVITY_TYPES.SAVE,
        },
        build: {
          generateActivation: true,
          generateConsumption: false,
          generateTarget: true,
          noSpellslot: true,
          generateSave: true,
          saveOverride: {
            ability: ["wis"],
            dc: {
              formula: "",
              calculation: "spellcasting",
            },
          },
          generateDamage: true,
          damageParts: [
            DDBEnricherData.basicDamagePart({
              number: 3,
              denomination: 8,
              types: ["necrotic", "radiant"],
              scalingMode: "whole",
              scalingNumber: 1,
            }),
          ],
          onSave: "half",
          activationOverride: {
            type: "special",
            condition: this.is2014
              ? "Enters the area for the first time on a turn or starts its turn there"
              : "Enters the Emanation for the first time on a turn or ends its turn there",
          },
          targetOverride: {
            override: true,
            affects: {
              count: "1",
              type: "creature",
            },
            template: {},
          },
        },
        overrides: {
          data: {
            range: {
              override: true,
              units: "spec",
            },
          },
        },
      },
    ];
  }

}
