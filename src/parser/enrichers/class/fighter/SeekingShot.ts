import DDBEnricherData from "../../data/DDBEnricherData";
import _ArcaneShot2024Option from "./_ArcaneShot2024Option";

export default class SeekingShot extends _ArcaneShot2024Option {

  protected override get diceCount(): number {
    return 2;
  }

  protected override get damageType(): string {
    return "force";
  }

  override get activity(): IDDBActivityData | null {
    return {
      data: {
        damage: {
          onSave: "half",
          critical: { allow: true },
          parts: [
            DDBEnricherData.basicDamagePart({
              customFormula: this.scaleFormula,
              types: [this.damageType],
            }),
          ],
        },
        save: { dc: { calculation: "int", formula: "" } },
        range: { value: null, units: "spec" },
      },
    };
  }

}
