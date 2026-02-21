import DDBEnricherData from "../data/DDBEnricherData";

export default class ArcaneOil extends DDBEnricherData {

  get type() {
    return "enchant";
  }

  get effects() {
    return [{
      type: "enchant",
      magicalBonus: {
        makeMagical: false,
        bonus: "2",
      },
    }];
  }

}
