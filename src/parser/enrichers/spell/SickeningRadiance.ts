import DDBEnricherData from "../data/DDBEnricherData";

export default class SickeningRadiance extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Cast",
      data: {
        behaviors: [
          DDBEnricherData.BehaviorHelper.activity({
            events: ["tokenEnter", "tokenTurnStart"],
            activityName: "Ongoing Save",
          }),
        ],
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Ongoing Save",
          type: DDBEnricherData.ACTIVITY_TYPES.SAVE,
        },
        build: {
          generateActivation: true,
          generateConsumption: false,
          generateTarget: true,
          noSpellslot: true,
          generateSave: true,
          saveOverride: {
            ability: ["con"],
            dc: {
              formula: "",
              calculation: "spellcasting",
            },
          },
          generateDamage: true,
          damageParts: [
            DDBEnricherData.basicDamagePart({ number: 4, denomination: 10, type: "radiant" }),
          ],
          activationOverride: {
            type: "special",
            condition: "Moves into the area for the first time on a turn or starts its turn there",
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
