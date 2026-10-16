import DDBEnricherData from "../data/DDBEnricherData";

export default class MistWalkerMistWalk extends DDBEnricherData {

  override get type(): IDDBActivityType {
    return DDBEnricherData.ACTIVITY_TYPES.TELEPORT;
  }

  override get activity(): IDDBActivityData {
    return {
      targetSelf: true,
      activationCondition: "When you take damage or fail a saving throw to avoid or end the Grappled or Restrained condition",
      data: {
        range: {
          override: true,
          value: "15",
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

}
