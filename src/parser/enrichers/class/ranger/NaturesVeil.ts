import DDBEnricherData from "../../data/DDBEnricherData";

export default class NaturesVeil extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Nature's Veil",
      activationType: "bonus",
      targetType: "self",
      addItemConsume: true,
    };
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Nature's Veil",
        statuses: ["invisible"],
        options: {
          expiry: "sourceEnd",
        },
      },
    ];
  }

}
