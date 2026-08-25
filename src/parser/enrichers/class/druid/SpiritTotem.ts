import DDBEnricherData from "../../data/DDBEnricherData";

export default class SpiritTotem extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.NONE;
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Bear Totem",
          type: DDBEnricherData.ACTIVITY_TYPES.HEAL,
        },
        build: {
          generateConsumption: true,
          generateTarget: true,
          generateHealing: true,
          generateActivation: true,
          generateRange: true,
          targetOverride: {
            affects: {
              count: "",
              type: "ally",
            },
            template: {
              contiguous: false,
              type: "radius",
              size: "30",
              units: "ft",
            },
          },
          rangeOverride: {
            value: "60",
            units: "ft",
          },
          healingPart: DDBEnricherData.basicDamagePart({
            customFormula: "5+@classes.druid.levels",
            type: "temphp",
          }),
        },
        overrides: {
          data: {
            behaviors: [
              DDBEnricherData.BehaviorHelper.applyEffect({ effects: DDBEnricherData.SRDEffects.checkAndSaveAdvantage("str") }),
            ],
          },
        },
      },
      {
        init: {
          name: "Hawk Spirit",
          type: DDBEnricherData.ACTIVITY_TYPES.UTILITY,
        },
        build: {
          generateConsumption: true,
          generateTarget: true,
          generateHealing: true,
          generateActivation: true,
          generateRange: true,
          targetOverride: {
            affects: {
              count: "",
              type: "ally",
            },
            template: {
              contiguous: false,
              type: "radius",
              size: "30",
              units: "ft",
            },
          },
          rangeOverride: {
            value: "60",
            units: "ft",
          },
        },
        overrides: {
          data: {
            behaviors: [
              DDBEnricherData.BehaviorHelper.applyEffect({ effects: DDBEnricherData.SRDEffects.skillAdvantage("prc") }),
            ],
          },
        },
      },
      {
        init: {
          name: "Unicorn Spirit",
          type: DDBEnricherData.ACTIVITY_TYPES.UTILITY,
        },
        build: {
          generateConsumption: true,
          generateTarget: true,
          generateHealing: true,
          generateActivation: true,
          generateRange: true,
          targetOverride: {
            affects: {
              count: "",
              type: "ally",
            },
            template: {
              contiguous: false,
              type: "radius",
              size: "30",
              units: "ft",
            },
          },
          rangeOverride: {
            value: "60",
            units: "ft",
          },
        },
        overrides: {
          data: {
            behaviors: [
              DDBEnricherData.BehaviorHelper.applyEffect({ effects: "Unicorn Spirit" }),
            ],
          },
        },
      },
      {
        init: {
          name: "Unicorn Spirit: Bonus Healing",
          type: DDBEnricherData.ACTIVITY_TYPES.HEAL,
        },
        build: {
          generateConsumption: false,
          generateTarget: true,
          generateHealing: true,
          generateActivation: true,
          generateRange: true,
          targetOverride: {
            affects: {
              count: "1",
              type: "ally",
            },
          },
          rangeOverride: {
            value: "60",
            units: "ft",
          },
          healingPart: DDBEnricherData.basicDamagePart({
            customFormula: "@classes.druid.levels",
            type: "healing",
          }),
        },
      },
    ];
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Unicorn Spirit",
        standalone: true,
        options: {
          durationSeconds: 60,
        },
      },
    ];
  }

}
