import DDBEnricherData from "../data/DDBEnricherData";

export default class OilOfSharpness extends DDBEnricherData {

  override get type() {
    return DDBEnricherData.ACTIVITY_TYPES.ENCHANT;
  }

  override get activity(): IDDBActivityData {
    return {
      allowMagical: true,
    };
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        type: "enchant",
        magicalBonus: {
          bonus: "3",
        },
      },
    ];
  }

}
