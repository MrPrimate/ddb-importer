import Generic from "../Generic";

export default class IngeniousMovement extends Generic {

  // the teleport is part of the Flash of Genius reaction, so it spends nothing of its own
  override get activity(): IDDBActivityData {
    return {
      activationType: "reaction",
      activationCondition: "As part of the Reaction when you use Flash of Genius",
      noConsumeTargets: true,
      data: {
        range: { override: true, units: "ft", value: "30" },
        target: {
          override: true,
          affects: { type: "creature", count: "1", choice: false, special: "You or a willing creature you can see" },
        },
      },
    };
  }

}
