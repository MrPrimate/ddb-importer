import DDBEnricherData from "../../data/DDBEnricherData";

export default class GallowsHumor extends DDBEnricherData {

  override get useDefaultAdditionalActivities(): boolean {
    return true;
  }

  override get effects(): IDDBEffectHint[] {
    if (!this.isAction) return [];
    return [
      {
        name: "Gallows Humor",
        options: {
          expiry: "targetEnd",
          description: "Prone with Speed 0 until the end of the creature's next turn.",
        },
        statuses: ["Prone"],
        changes: [
          DDBEnricherData.ChangeHelper.movementMultiplierChange("0", 50),
        ],
      },
    ];
  }

}
