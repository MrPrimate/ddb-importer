import DDBEnricherData from "../../data/DDBEnricherData";

export default class GallowsHumor extends DDBEnricherData {

  get useDefaultAdditionalActivities(): boolean {
    return true;
  }

  get effects(): IDDBEffectHint[] {
    if (!this.isAction) return [];
    return [
      {
        name: "Gallows Humor",
        options: {
          durationRounds: 1,
          description: "Prone with Speed 0 until the end of the creature's next turn.",
        },
        daeSpecialDurations: ["turnEnd"],
        statuses: ["Prone"],
        changes: [
          DDBEnricherData.ChangeHelper.multiplyChange("0", 50, "system.attributes.movement.walk"),
        ],
      },
    ];
  }

}
