import DDBEnricherData from "../data/DDBEnricherData";

export default class PowerWordStun extends DDBEnricherData {

  override get effects(): IDDBEffectHint[] {
    if (this.is2014) return [];
    return [
      {
        name: "No Movement",
        changes: [
          DDBEnricherData.ChangeHelper.movementMultiplierChange("0", 20),
        ],
        options: { expiry: "sourceStart" },
      },
    ];
  }

}
