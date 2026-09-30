import DDBEnricherData from "../../data/DDBEnricherData";

export default class RallyingSurge extends DDBEnricherData {

  override get activity(): IDDBActivityData {
    return {
      // rides on Action Surge, which spends its own use
      noConsumeTargets: true,
      activationType: "special",
      activationCondition: "You use Action Surge",
      targetType: "ally",
      targetCount: "max(1, @abilities.cha.mod)",
      data: {
        target: {
          affects: {
            type: "ally",
          },
          template: {
            contiguous: false,
            type: "radius",
            size: "@scale.banneret.group-recovery",
            units: "ft",
          },
        },
      },
    };
  }

}
