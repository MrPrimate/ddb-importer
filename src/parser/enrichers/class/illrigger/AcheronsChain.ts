import DDBEnricherData from "../../data/DDBEnricherData";
import _Illrigger from "./_Illrigger";

export default class AcheronsChain extends _Illrigger {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.SAVE;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Acheron's Chain",
      activationType: "special",
      activationCondition: "When you place or move a seal on a Large or smaller creature with a bonus action",
      targetType: "creature",
      targetCount: 1,
      rangeType: "ft",
      rangeValue: 30,
      data: {
        save: {
          ability: ["str"],
          dc: _Illrigger.INTERDICT_DC,
        },
      },
    };
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Acheron's Chain: Grappled",
        activityMatch: "Acheron's Chain",
        statuses: ["Grappled"],
        options: {
          description: "Grappled until the end of the illrigger's next turn (escape DC equals their interdict save DC). Instead of grappling, the illrigger can pull you 10 feet toward them.",
          expiry: "sourceEnd",
        },
      },
    ];
  }

}
