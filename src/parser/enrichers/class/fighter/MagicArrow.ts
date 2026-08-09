import DDBEnricherData from "../../data/DDBEnricherData";

export default class MagicArrow extends DDBEnricherData {

  override get type() {
    return DDBEnricherData.ACTIVITY_TYPES.ENCHANT;
  }

  override get activity(): IDDBActivityData {
    return {
      data: {
        restrictions: {
          type: "weapon",
          allowMagical: false,
        },
      },
    };
  }

  override get effects(): IDDBEffectHint[] {
    return [{
      type: "enchant",
      magicalBonus: {
        makeMagical: true,
      },
    }];
  }

}
