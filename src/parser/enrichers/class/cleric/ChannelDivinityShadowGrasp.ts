import DDBEnricherData from "../../data/DDBEnricherData";

export default class ChannelDivinityShadowGrasp extends DDBEnricherData {

  override get useDefaultAdditionalActivities(): boolean {
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
          expiry: "sourceEnd",
          description: "Restrained by its shadow until the end of the cleric's next turn (failed save).",
        },
      },
      {
        name: "Shadow Grasp: Grappled",
        statuses: ["Grappled"],
        options: {
          expiry: "sourceEnd",
          description: "Grappled by its shadow until the end of the cleric's next turn (successful save).",
        },
      },
    ];
  }

}
