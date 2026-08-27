import DDBEnricherData from "../data/DDBEnricherData";

export default class DimensionDoor extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.TELEPORT;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Teleport",
      activationType: "action",
      overrideActivation: true,
      data: {
        range: {
          override: true,
          value: "500",
          units: "ft",
          special: "",
        },
        target: {
          override: true,
          prompt: false,
          affects: {
            count: "2",
            type: "willing",
            special: "Control the caster and, optionally, one willing creature within 5 feet of the caster. Companion size restrictions are adjudicated manually.",
          },
          template: {},
        },
      },
    };
  }

}
