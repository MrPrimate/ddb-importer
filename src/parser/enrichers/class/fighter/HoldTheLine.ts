import DDBEnricherData from "../../data/DDBEnricherData";

export default class HoldTheLine extends DDBEnricherData {

  override get useDefaultAdditionalActivities(): boolean {
    return true;
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Held",
        changes: [
          DDBEnricherData.ChangeHelper.downgradeChange("0", 100, "system.attributes.movement.all"),
        ],
        daeSpecialDurations: ["turnEnd" as const],
        options: {
          durationSeconds: 3,
        },
      },
    ];
  }

}
