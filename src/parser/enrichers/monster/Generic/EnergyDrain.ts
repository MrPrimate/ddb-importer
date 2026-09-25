import _MonsterFeatureSupport from "./_MonsterFeatureSupport";

/** Source-guarded activities for Energy Drain. */
export default class EnergyDrain extends _MonsterFeatureSupport {
  override get additionalActivities(): IDDBAdditionalActivity[] {
    const activities: IDDBAdditionalActivity[] = [];
    const loss = this.text.match(/maximum decreases by (\d+)(?:\s*\((\d+d\d+)\))?/i);
    if (loss)
      activities.push(
        this.extra("HP Maximum Decrease", "ddbMaxHPLoss0001", "utility", {
          generateRoll: true,
          rollOverride: { formula: loss[2] ?? loss[1], name: "HP Maximum Decrease", visible: true, prompt: false },
          activationOverride: {
            type: "special",
            value: null,
            condition: "After a failed save, reduce the target's HP maximum by this roll manually.",
          },
        }),
      );
    return activities;
  }
}
