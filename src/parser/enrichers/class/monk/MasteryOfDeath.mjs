/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class MasteryOfDeath extends DDBEnricherData {
  get type() {
    return "heal";
  }

  get activity() {
    return {
      itemConsumeTargetName: this.is2014 ? "Ki" : "Monk's Focus",
      activationType: "special",
      data: {
        healing: DDBEnricherData.basicDamagePart({
          bonus: "1",
          types: ["healing"],
        }),
      },
    };
  }

}
