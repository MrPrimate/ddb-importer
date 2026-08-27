import DDBEnricherData from "../data/DDBEnricherData";

export default class FarStep extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.TELEPORT;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Cast and Teleport",
      activationType: "bonus",
      overrideActivation: true,
      data: {
        range: {
          override: true,
          value: "60",
          units: "ft",
          special: "",
        },
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
          name: "Teleport Again",
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
            type: "bonus",
          },
          rangeOverride: {
            value: "60",
            units: "ft",
            special: "",
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
