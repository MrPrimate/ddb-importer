import DDBEnricherData from "../data/DDBEnricherData";

export default class AcidVial extends DDBEnricherData {

  get activity(): IDDBActivityData {
    return {
      type: DDBEnricherData.ACTIVITY_TYPES.ATTACK,
      addItemConsume: true,
      targetType: "creature",
      data: {
        attack: {
          ability: "dex",
          type: {
            value: "ranged",
            classification: "weapon",
          },
        },
      },
    };
  }

}
