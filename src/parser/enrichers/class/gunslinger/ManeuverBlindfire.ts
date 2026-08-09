import DDBEnricherData from "../../data/DDBEnricherData";

export default class ManeuverBlindfire extends DDBEnricherData {

  override get type() {
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
          durationTurns: 1,
        },
        daeSpecialDurations: ["turnEnd"],
        changes: [
          DDBEnricherData.ChangeHelper.upgradeChange("30", 20, "system.attributes.senses.blindsight"),
        ],
        atlChanges: [
          DDBEnricherData.ChangeHelper.upgradeChange("30", 20, "ATL.detectionModes.blindsight.range"),
        ],
      },
    ];
  }

}
