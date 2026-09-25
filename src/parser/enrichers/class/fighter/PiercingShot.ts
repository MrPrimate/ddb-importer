import DDBEnricherData from "../../data/DDBEnricherData";
import _ArcaneShot2024Option from "./_ArcaneShot2024Option";

/**
 * AU 2024. No attack roll: the ammunition becomes a 30 ft line from the archer, each creature
 * makes a Dexterity save for half, and two Arcane Shot Dice of piercing damage ride on top of the
 * weapon's damage.
 */
export default class PiercingShot extends _ArcaneShot2024Option {

  protected override get diceCount(): number {
    return 2;
  }

  protected override get damageType(): string {
    return "piercing";
  }

  override get activity(): IDDBActivityData | null {
    return {
      data: {
        damage: {
          onSave: "half",
          critical: { allow: false },
          parts: [
            DDBEnricherData.basicDamagePart({
              customFormula: this.scaleFormula,
              types: [this.damageType],
            }),
          ],
        },
        save: { ability: ["dex"], dc: { calculation: "int", formula: "" } },
        range: { units: "self" },
        target: {
          affects: { type: "creature" },
          template: { type: "line", size: "30", width: "1", units: "ft" },
        },
      },
    };
  }

}
