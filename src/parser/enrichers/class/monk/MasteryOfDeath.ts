import DDBEnricherData from "../../data/DDBEnricherData";

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
