import DDBEnricherData from "../../data/DDBEnricherData";

export default class InspiredEclipse extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      targetType: "self",
      addItemConsume: true,
      activationType: "special",
      activationCondition: "Give someone Bardic Inspiration",
    };
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        statuses: ["Invisible"],
        options: {
          // "This invisibility lasts until the start of your next turn" - a self buff
          expiry: "sourceStart",
        },
        daeSpecialDurations: ["1Attack", "1Spell"],
      },
    ];
  }

}
