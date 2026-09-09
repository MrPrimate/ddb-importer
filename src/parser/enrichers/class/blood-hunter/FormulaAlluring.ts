import DDBEnricherData from "../../data/DDBEnricherData";
import _Mutagen from "./_Mutagen";

/** Advantage on Charisma checks, disadvantage on initiative rolls. */
export default class FormulaAlluring extends _Mutagen {

  override get effects(): IDDBEffectHint[] {
    return [
      this.mutagenEffect({
        changes: [
          DDBEnricherData.ChangeHelper.advantageAbilityCheckChange("cha"),
          DDBEnricherData.ChangeHelper.disadvantageInitiativeChange(),
        ],
      }),
    ];
  }

}
