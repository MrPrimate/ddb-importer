import DDBEnricherData from "../data/DDBEnricherData";

export default class CordonOfArrows extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Cast",
      data: {
        target: {
          override: true,
          affects: {
            type: "creature",
          },
          template: {
            contiguous: false,
            type: "radius",
            size: "30",
            units: "ft",
          },
        },
        behaviors: [
          DDBEnricherData.BehaviorHelper.activity({
            events: ["tokenEnter", "tokenTurnEnd"],
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
            ability: ["dex"],
            dc: {
              formula: "",
              calculation: "spellcasting",
            },
          },
          generateDamage: true,
          damageParts: [
            DDBEnricherData.basicDamagePart({ number: 2, denomination: 4, type: "piercing" }),
          ],
          activationOverride: {
            type: "special",
            condition: "Enters within 30 feet of the ammunition or ends its turn there (consumes one piece)",
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
