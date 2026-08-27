import DDBEnricherData from "../data/DDBEnricherData";

export default class TreeStride extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Cast",
      targetSelf: true,
      data: {
        target: {
          override: true,
          prompt: false,
          affects: {
            count: "1",
            type: "self",
          },
          template: {},
        },
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Travel Through Tree",
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
            condition: "Costs 5 feet of movement and requires eligible living trees",
          },
          rangeOverride: {
            value: "500",
            units: "ft",
            special: "Between eligible living trees; tree restrictions are adjudicated manually.",
          },
          targetOverride: {
            prompt: false,
            affects: {
              count: "1",
              type: "self",
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
        },
      },
    ];
  }

}
