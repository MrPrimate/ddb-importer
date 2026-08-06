import DDBEnricherData from "../../data/DDBEnricherData";

export default class StealBloodHeal extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.HEAL;
  }

  get activity(): IDDBActivityData {
    return {
      name: "Heal Instead of Restoring Die",
      targetType: "self",
      activationType: "special",
      activationCondition: "Dealing Sneak Attack damage while Bloodied",
      data: {
        range: {
          units: "self",
        },
        healing: DDBEnricherData.basicDamagePart({ number: 1, denomination: 8, types: ["healing"] }),
      },
    };
  }

}
