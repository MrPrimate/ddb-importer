import DDBEnricherData from "../../data/DDBEnricherData";

export default class ChannelDivinityShadowGrasp extends DDBEnricherData {

  override get useDefaultAdditionalActivities() {
    return true;
  }

  override get activity(): IDDBActivityData | null {
    if (!this.isAction) return null;
    return {
      targetType: "creature",
      data: {
        range: {
          units: "ft",
          value: "30",
        },
      },
    };
  }

  override get effects(): IDDBEffectHint[] {
    if (!this.isAction) return [];
    return [
      {
        name: "Shadow Grasp: Restrained",
        statuses: ["Restrained"],
        options: {
          durationRounds: 1,
          description: "Restrained by its shadow until the end of the cleric's next turn (failed save).",
        },
        daeSpecialDurations: ["turnEndSource"],
      },
      {
        name: "Shadow Grasp: Grappled",
        statuses: ["Grappled"],
        options: {
          durationRounds: 1,
          description: "Grappled by its shadow until the end of the cleric's next turn (successful save).",
        },
        daeSpecialDurations: ["turnEndSource"],
      },
    ];
  }

}
