import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * The stat block regains 10 hit points at the start of its turn while it has at
 * least 1 hit point left; DDB gives no activity for it.
 */
export default class Regenerate extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.HEAL;
  }

  get activity(): IDDBActivityData {
    return {
      name: "Regenerate",
      activationType: "turnStart",
      activationCondition: "Start of the Shield Guardian's turn, if it has at least 1 hit point",
      targetType: "self",
      rangeSelf: true,
      data: {
        healing: DDBEnricherData.basicDamagePart({
          bonus: "10",
          types: ["healing"],
        }),
      },
    };
  }

}
