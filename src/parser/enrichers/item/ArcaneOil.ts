import DDBEnricherData from "../data/DDBEnricherData";

export default class ArcaneOil extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.ENCHANT;
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
