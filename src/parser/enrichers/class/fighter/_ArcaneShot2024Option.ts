import DDBEnricherData from "../../data/DDBEnricherData";
import ArcaneShotOption from "./ArcaneShotOption";

/**
 * Shared shape for the AU 2024 Arcane Shot options: the DDB action carries a fixed die for the
 * captured level, so the damage part is rewritten onto the Arcane Shot Die scale and the save
 * DC onto Intelligence.
 */
export default abstract class _ArcaneShot2024Option extends ArcaneShotOption {

  /** whether the character carries a DDB class action with this exact name */
  protected hasDdbClassAction(name: string): boolean {
    const actions = this.ddbParser?.ddbData?.character?.actions?.class ?? [];
    return actions.some((action) => action.name === name);
  }

  /** number of Arcane Shot Dice the option rolls */
  protected get diceCount(): number {
    return 1;
  }

  protected abstract get damageType(): string;

  protected get scaleFormula(): string {
    return this.diceCount === 1
      ? "@scale.arcane-archer.arcane-shot"
      : `${this.diceCount}@scale.arcane-archer.arcane-shot.die`;
  }

  override get clearAutoEffects(): boolean {
    return true;
  }

  override get activity(): IDDBActivityData | null {
    return {
      data: {
        damage: {
          onSave: "full",
          critical: { allow: true },
          parts: [
            DDBEnricherData.basicDamagePart({
              customFormula: this.scaleFormula,
              types: [this.damageType],
            }),
          ],
        },
        save: {
          dc: { calculation: "int", formula: "" },
        },
        range: { value: null, units: "spec" },
      },
    };
  }

}
