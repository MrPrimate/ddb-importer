import DDBEnricherData from "../../data/DDBEnricherData";
import _Mutagen from "./_Mutagen";

/** Intelligence and its maximum rise by 3 (4 at 11th level, 5 at 18th); Charisma saves suffer. */
export default class FormulaSagacity extends _Mutagen {

  get effects(): IDDBEffectHint[] {
    return this.scoreMutagenEffects("int", DDBEnricherData.ChangeHelper.disadvantageAbilitySaveChange("cha"));
  }

}
