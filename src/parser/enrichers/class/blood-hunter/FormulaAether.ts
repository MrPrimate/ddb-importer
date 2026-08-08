import DDBEnricherData from "../../data/DDBEnricherData";
import _Mutagen from "./_Mutagen";

/** Flying speed of 20 feet for 1 hour, at the cost of Strength and Dexterity checks. */
export default class FormulaAether extends _Mutagen {

  get effects(): IDDBEffectHint[] {
    return [
      this.mutagenEffect({
        durationSeconds: 3600,
        changes: [
          DDBEnricherData.ChangeHelper.upgradeChange("20", 20, "system.attributes.movement.fly"),
          _Mutagen.disadvantageCheck("str"),
          _Mutagen.disadvantageCheck("dex"),
        ],
      }),
    ];
  }

}
