import DDBEnricherData from "../data/DDBEnricherData";

export default class Scatter extends DDBEnricherData {

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Teleport Affected Creatures",
          type: DDBEnricherData.ACTIVITY_TYPES.TELEPORT,
        },
        build: {
          noSpellslot: true,
          generateAttack: false,
          generateConsumption: true,
          generateDamage: false,
          generateDuration: true,
          generateRange: true,
          generateSave: false,
          generateTarget: true,
          activationOverride: {
            type: "special",
            condition: "After resolving willing creatures and failed saves",
          },
          rangeOverride: {
            value: "30",
            units: "ft",
            special: "",
          },
          targetOverride: {
            prompt: false,
            affects: {
              count: "5",
              type: "creature",
              special: "Control only willing creatures and creatures that failed the save.",
            },
            template: {},
          },
          durationOverride: {
            units: "inst",
            concentration: false,
          },
        },
        overrides: {
          noConsumeTargets: true,
          noSpellslot: true,
          data: {
            teleport: {
              override: true,
              value: "120",
            },
          },
        },
      },
    ];
  }

}
