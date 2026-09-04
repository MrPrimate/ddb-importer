import _ArcaneShot2024Option from "./_ArcaneShot2024Option";
import DDBEnricherData from "../../data/DDBEnricherData";

export default class BanishingShot extends _ArcaneShot2024Option {

  protected override get damageType(): string {
    return "psychic";
  }

  override get effects(): IDDBEffectHint[] {
    if (this.isAction) return [];
    return [
      {
        name: "Banished",
        activityMatch: this.name,
        statuses: ["Incapacitated"],
        changes: [
          DDBEnricherData.ChangeHelper.movementMultiplierChange("0", 20),
        ],
        options: { expiry: "targetEnd" },
      },
    ];
  }

}
