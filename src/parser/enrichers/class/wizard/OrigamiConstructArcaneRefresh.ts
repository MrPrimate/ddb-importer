import DDBEnricherData from "../../data/DDBEnricherData";

/** Origami Mage: a destroyed construct returns 10 hit points (or a spell slot of level 2 or lower). */
export default class OrigamiConstructArcaneRefresh extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.HEAL;
  }

  override get activity(): IDDBActivityData {
    return {
      targetType: "self",
      activationType: "special",
      activationCondition: "One of your origami constructs is destroyed (or regain a spell slot of level 2 or lower instead)",
      noConsumeTargets: true,
      data: {
        healing: DDBEnricherData.basicDamagePart({ customFormula: "10", types: ["healing"] }),
      },
    };
  }

}
