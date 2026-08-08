import DDBEnricherData from "../../data/DDBEnricherData";
import _Mutagen from "./_Mutagen";

/** Advantage on Dexterity checks, disadvantage on Wisdom checks. */
export default class FormulaDeftness extends _Mutagen {

  get effects(): IDDBEffectHint[] {
    return [
      this.mutagenEffect({
        changes: [
          DDBEnricherData.ChangeHelper.advantageAbilityCheckChange("dex"),
          DDBEnricherData.ChangeHelper.disadvantageAbilityCheckChange("wis"),
        ],
      }),
    ];
  }

}
