import DDBEnricherData from "../../data/DDBEnricherData";
import _Mutagen from "./_Mutagen";

/** Advantage on Wisdom checks, disadvantage on Charisma checks. */
export default class FormulaPercipient extends _Mutagen {

  override get effects(): IDDBEffectHint[] {
    return [
      this.mutagenEffect({
        changes: [
          DDBEnricherData.ChangeHelper.advantageAbilityCheckChange("wis"),
          DDBEnricherData.ChangeHelper.disadvantageAbilityCheckChange("cha"),
        ],
      }),
    ];
  }

}
