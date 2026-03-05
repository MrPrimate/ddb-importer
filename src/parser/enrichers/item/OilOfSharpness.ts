import DDBEnricherData from "../data/DDBEnricherData";

export default class OilOfSharpness extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.ENCHANT;
  }

  get activity(): IDDBActivityData {
    return {
      allowMagical: true,
    };
  }

  get effects(): IDDBEffectHint[] {
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
