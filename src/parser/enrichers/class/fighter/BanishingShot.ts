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
          DDBEnricherData.ChangeHelper.customChange("*0", 20, "system.attributes.movement.all"),
          ...["walk", "fly", "swim", "climb", "burrow"].map((mode) =>
            DDBEnricherData.ChangeHelper.overrideChange("0", 60, `system.attributes.movement.${mode}`)),
        ],
        options: { expiry: "targetEnd" },
      },
    ];
  }

}
