import DDBEnricherData from "../../data/DDBEnricherData";

export default class DancingShadows extends DDBEnricherData {

  get useDefaultAdditionalActivities(): boolean {
    return true;
  }

  get type() {
    return this.isAction ? DDBEnricherData.ACTIVITY_TYPES.UTILITY : DDBEnricherData.ACTIVITY_TYPES.NONE;
  }

  get activity(): IDDBActivityData {
    return {
      targetType: "self",
      activationType: "bonus",
      addItemConsume: true,
      itemConsumeTargetName: "Bardic Inspiration",
      data: {
        range: {
          units: "self",
        },
        duration: {
          units: "minute",
          value: "1",
        },
        target: {
          template: {
            contiguous: false,
            type: "radius",
            size: "20",
            units: "ft",
          },
          prompt: false,
        },
      },
    };
  }

  get effects(): IDDBEffectHint[] {
    if (!this.isAction) return [];
    return [
      {
        name: "Dancing Shadows",
        options: {
          durationSeconds: 60,
          description: "Allied creatures in the sphere of shifting shadows have Half Cover, and creatures outside it have Disadvantage on Wisdom (Perception) checks to perceive anything inside. Ends early if you are Incapacitated or die.",
        },
        statuses: ["HalfCover"],
      },
    ];
  }

}
