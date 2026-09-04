import _ArcaneShot2024Option from "./_ArcaneShot2024Option";
import DDBEnricherData from "../../data/DDBEnricherData";

export default class EnfeeblingShot extends _ArcaneShot2024Option {

  protected override get diceCount(): number {
    return 2;
  }

  protected override get damageType(): string {
    return "necrotic";
  }

  override get effects(): IDDBEffectHint[] {
    if (this.isAction) return [];
    return [
      {
        name: "Enfeebled",
        activityMatch: this.name,
        statuses: ["Poisoned"],
        changes: [
          // a Poisoned target subtracts one Arcane Shot Die from its attack damage
          DDBEnricherData.ChangeHelper.ruleBonusChange("damage", "-@scale.arcane-archer.arcane-shot"),
        ],
        options: { expiry: "targetEnd" },
      },
    ];
  }

}
