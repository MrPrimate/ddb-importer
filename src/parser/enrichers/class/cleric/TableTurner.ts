import DDBEnricherData from "../../data/DDBEnricherData";

export default class TableTurner extends DDBEnricherData {

  get useDefaultAdditionalActivities() {
    return true;
  }

  get activity(): IDDBActivityData | null {
    if (!this.isAction) return null;
    return {
      data: {
        damage: {
          onSave: "half",
        },
      },
    };
  }

  get effects(): IDDBEffectHint[] {
    if (!this.isAction) return [];
    return [
      {
        name: "Table-Turner: Poisoned",
        statuses: ["Poisoned"],
        options: {
          durationRounds: 1,
          description: "Poisoned until the end of its next turn (failed save only).",
        },
        daeSpecialDurations: ["turnEnd"],
      },
    ];
  }

}
