import DDBEnricherData from "../../data/DDBEnricherData";

export default class ManeuverBlindfire extends DDBEnricherData {

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
        name: "Blindfire",
        options: {
          // "gain Blindsight with a range of 30 feet until the end of your turn" - a self buff
          expiry: "sourceEnd",
        },
        changes: [
          DDBEnricherData.ChangeHelper.upgradeChange("30", 20, "system.attributes.senses.ranges.blindsight"),
        ],
      },
    ];
  }

}
