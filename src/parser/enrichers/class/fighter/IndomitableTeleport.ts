import DDBEnricherData from "../../data/DDBEnricherData";

export default class IndomitableTeleport extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.TELEPORT;
  }

  override get activity(): IDDBActivityData {
    return {
      activationType: "special",
      activationCondition: "When you succeed on a save using Indomitable",
      overrideActivation: true,
      data: {
        range: { override: true, value: "60", units: "ft", special: "" },
        target: {
          override: true,
          prompt: false,
          affects: { count: "1", type: "self" },
          template: {},
        },
      },
    };
  }

}
