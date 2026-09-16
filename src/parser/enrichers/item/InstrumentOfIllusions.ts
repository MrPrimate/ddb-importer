import DDBEnricherData from "../data/DDBEnricherData";
import { itemActivity } from "./_ItemActivities";

export default class InstrumentOfIllusions extends DDBEnricherData {

  override get type(): IDDBActivityType {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return this.illusion("Illusory Effects (Non-Bard)", "5");
  }

  illusion(name: string, size: string): IDDBActivityData {
    return {
      name,
      activationType: this.is2014 ? "special" : "action",
      activationCondition: "While playing; ends when you stop playing",
      noConsumeTargets: true,
      rangeSelf: true,
      overrideTarget: true,
      data: { target: { affects: { type: "space", count: "" }, template: { type: "radius", size, units: "ft" } } },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      itemActivity("Illusory Effects (Bard)", DDBEnricherData.ACTIVITY_TYPES.UTILITY, {
        ...this.illusion("Illusory Effects (Bard)", "15"),
        noTemplate: false,
      }),
    ];
  }

}
