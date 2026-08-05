import DDBEnricherData from "../../data/DDBEnricherData";

export default class ManeuverBlindfire extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  get activity(): IDDBActivityData {
    return {
      targetType: "self",
      activationType: "bonus",
    };
  }

  get effects(): IDDBEffectHint[] {
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
