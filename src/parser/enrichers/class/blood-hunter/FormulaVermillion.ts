import DDBEnricherData from "../../data/DDBEnricherData";
import _Mutagen from "./_Mutagen";

/**
 * Disadvantage on death saving throws.
 *
 * The additional Blood Maledict use cannot be granted from here: an actor effect cannot reach
 * another item's uses, so it is left to the description.
 */
export default class FormulaVermillion extends _Mutagen {

  get effects(): IDDBEffectHint[] {
    return [
      this.mutagenEffect({
        changes: [
          DDBEnricherData.ChangeHelper.disadvantageDeathSaveChange(),
        ],
      }),
    ];
  }

}
