import DDBEnricherData from "../../data/DDBEnricherData";

export default class MagicArrow extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.ENCHANT;
  }

  get activity() {
    return {
      data: {
        restrictions: {
          type: "weapon",
          allowMagical: false,
        },
      },
    };
  }

  get effects(): IDDBEffectHint[] {
    return [{
      type: "enchant",
      magicalBonus: {
        makeMagical: true,
      },
    }];
  }

}
