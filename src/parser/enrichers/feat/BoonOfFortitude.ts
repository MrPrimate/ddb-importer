import DDBEnricherData from "../data/DDBEnricherData";

export default class BoonOfFortitude extends DDBEnricherData {

  get activity() {
    return {
      name: "Healing Bonus",
      type: "heal",
      targetType: "self",
      activationType: "special",
      activationCondition: "Once a turn",
      data: {
        healing: DDBEnricherData.basicDamagePart({ bonus: "@abilities.con.mod", type: "healing" }),
      },
    };
  }

}
