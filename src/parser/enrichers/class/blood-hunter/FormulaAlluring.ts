import DDBEnricherData from "../../data/DDBEnricherData";
import _Mutagen from "./_Mutagen";

/** Advantage on Charisma checks, disadvantage on initiative rolls. */
export default class FormulaAlluring extends _Mutagen {

  get effects(): IDDBEffectHint[] {
    return [
      this.mutagenEffect({
        changes: [
          _Mutagen.advantageCheck("cha"),
          DDBEnricherData.ChangeHelper.unsignedAddChange(
            `${CONFIG.Dice.D20Roll.ADV_MODE.DISADVANTAGE}`, 20, "system.attributes.init.roll.mode",
          ),
        ],
      }),
    ];
  }

}
