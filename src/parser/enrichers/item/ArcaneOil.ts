import DDBEnricherData from "../data/DDBEnricherData";

export default class ArcaneOil extends DDBEnricherData {

  override get type() {
    return DDBEnricherData.ACTIVITY_TYPES.ENCHANT;
  }

  override get effects(): IDDBEffectHint[] {
    return [{
      type: "enchant",
      magicalBonus: {
        makeMagical: false,
        bonus: "2",
      },
    }];
  }

}
