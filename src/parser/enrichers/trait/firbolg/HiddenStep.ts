import DDBEnricherData from "../../data/DDBEnricherData";

export default class HiddenStep extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      targetType: "self",
      activationType: "bonus",
    };
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Hidden Step",
        statuses: ["Invisible"],
        options: {
          expiry: "sourceStart",
          description: "You are Invisible until the start of your next turn, or until you attack, deal damage, or force a saving throw.",
        },
        daeSpecialDurations: ["1Attack"],
      },
    ];
  }

}
