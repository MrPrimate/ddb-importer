import DDBEnricherData from "../../data/DDBEnricherData";
import _Mutagen from "./_Mutagen";

/** Advantage on Intelligence checks, disadvantage on Wisdom checks. */
export default class FormulaConversant extends _Mutagen {

  get effects(): IDDBEffectHint[] {
    return [
      this.mutagenEffect({
        changes: [
          DDBEnricherData.ChangeHelper.advantageAbilityCheckChange("int"),
          DDBEnricherData.ChangeHelper.disadvantageAbilityCheckChange("wis"),
        ],
      }),
    ];
  }

}
