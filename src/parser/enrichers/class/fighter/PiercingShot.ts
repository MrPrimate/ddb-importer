import DDBEnricherData from "../../data/DDBEnricherData";
import _ArcaneShot2024Option from "./_ArcaneShot2024Option";

/**
 * AU 2024. DDB shipped this option's action under the name "Beguiling Shot" (bug reported
 * 2026-09-03); while no "Piercing Shot" action exists the line save is built here. Once DDB
 * corrects the name the action path applies with the line template and half damage on a save.
 */
export default class PiercingShot extends _ArcaneShot2024Option {

  protected override get diceCount(): number {
    return 2;
  }

  protected override get damageType(): string {
    return "piercing";
  }

  get ddbActionBug(): boolean {
    return !this.hasDdbClassAction("Piercing Shot");
  }

  override get type(): IDDBActivityType | null {
    if (!this.ddbActionBug) return super.type;
    return DDBEnricherData.ACTIVITY_TYPES.SAVE;
  }

  override get useDefaultAdditionalActivities(): boolean {
    return this.ddbActionBug ? false : super.useDefaultAdditionalActivities;
  }

  override get addAutoAdditionalActivities(): boolean {
    return this.ddbActionBug ? false : super.addAutoAdditionalActivities;
  }

  override get activity(): IDDBActivityData | null {
    const line: IDDBActivityData["data"] = {
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
    };
    if (!this.ddbActionBug) return { data: line };
    return {
      name: "Piercing Line",
      activationType: "special",
      targetType: "creature",
      data: line,
    };
  }

}
