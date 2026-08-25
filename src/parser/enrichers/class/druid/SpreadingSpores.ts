import DDBEnricherData from "../../data/DDBEnricherData";

export default class SpreadingSpores extends DDBEnricherData {

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
            activityName: "Save vs Spore Damage",
          }),
        ],
        target: {
          affects: {
            type: "creature",
          },
          template: {
            contiguous: false,
            type: "cube",
            size: "10",
            units: "ft",
          },
          prompt: false,
        },
        duration: {
          value: "10",
          units: "minute",
        },
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        action: {
          name: "Halo of Spores",
          type: "class",
          rename: ["Save vs Spore Damage"],
        },
        overrides: {
          noConsumeTargets: true,
          activationType: "special",
        },
      },
    ];
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Within Spreading Spores",
      },
    ];
  }
}
