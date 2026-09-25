import DDBEnricherData from "../../data/DDBEnricherData";
import _Illrigger from "./_Illrigger";

export default class CharmEnemy extends _Illrigger {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.SAVE;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Charm Enemy",
      addItemConsume: true,
      activationType: "bonus",
      activationCondition: "When you place a seal on a Humanoid with a bonus action. You can also burn seals on other interdicted Humanoids within 30 feet to charm them.",
      targetType: "creature",
      targetCount: 1,
      rangeType: "ft",
      rangeValue: 30,
      data: {
        duration: {
          units: "hour",
          value: "1",
        },
        save: {
          ability: ["cha"],
          dc: _Illrigger.INTERDICT_DC,
        },
      },
    };
  }

  override get clearAutoEffects(): boolean {
    return true;
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Charm Enemy: Charmed",
        activityMatch: "Charm Enemy",
        statuses: ["Charmed"],
        options: {
          durationSeconds: 3600,
          description: "Charmed by the illrigger, regarding them as a friendly acquaintance. Ends early if the illrigger or their companions do anything harmful to you.",
        },
      },
    ];
  }

}
