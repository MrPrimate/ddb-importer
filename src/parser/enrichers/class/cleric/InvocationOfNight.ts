import DDBEnricherData from "../../data/DDBEnricherData";

export default class InvocationOfNight extends DDBEnricherData {

  override get useDefaultAdditionalActivities() {
    return true;
  }

  override get activity(): IDDBActivityData | null {
    if (!this.isAction) return null;
    return {
      addItemConsume: true,
      itemConsumeTargetName: "Channel Divinity",
      targetType: "enemy",
      rangeSelf: true,
      data: {
        target: {
          template: {
            size: "30",
            units: "ft",
            type: "radius",
          },
        },
      },
    };
  }

  override get effects(): IDDBEffectHint[] {
    if (!this.isAction) return [];
    return [
      {
        name: "Invocation of Night: Blinded",
        statuses: ["Blinded"],
        options: {
          durationSeconds: 60,
          description: "Blinded for a number of rounds equal to the cleric's level. Repeat the saving throw at the end of each turn, ending the effect on a success.",
        },
      },
    ];
  }

}
