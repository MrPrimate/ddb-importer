/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class RallyingSurge extends DDBEnricherData {

  get activity() {
    return {
      addItemConsume: true,
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
