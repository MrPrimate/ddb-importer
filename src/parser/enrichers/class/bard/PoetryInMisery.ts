import DDBEnricherData from "../../data/DDBEnricherData";

/** College of Tragedy: a Reaction to a natural 1 within 30 feet regains one expended Bardic Inspiration (a negative cost). */
export default class PoetryInMisery extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      targetType: "self",
      activationType: "reaction",
      activationCondition: "You or an ally within 30 feet rolls a 1 on the d20 for an attack roll, ability check or saving throw",
      data: {
        consumption: {
          targets: [{ type: "itemUses", target: "bardic-inspiration", value: "-1", scaling: { mode: "", formula: "" } }],
          scaling: { allowed: false, max: "" },
        },
      },
    };
  }

}
