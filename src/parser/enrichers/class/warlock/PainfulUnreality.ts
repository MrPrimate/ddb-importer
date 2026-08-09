import DDBEnricherData from "../../data/DDBEnricherData";

export default class PainfulUnreality extends DDBEnricherData {

  override get useDefaultAdditionalActivities(): boolean {
    return true;
  }

  override get activity(): IDDBActivityData | null {
    if (!this.isAction) return null;
    return {
      data: {
        damage: {
          onSave: "half",
        },
      },
    };
  }

  override get effects(): IDDBEffectHint[] {
    if (!this.isAction) return [];
    return [
      {
        name: "Painful Unreality: Stunned",
        statuses: ["Stunned"],
        options: {
          durationTurns: 1,
          description: "Stunned until the end of its next turn (on a failed save only).",
        },
        daeSpecialDurations: ["turnEnd"],
      },
    ];
  }

}
