import DDBEnricherData from "../../data/DDBEnricherData";
import _Mutagen from "./_Mutagen";

/** Resistance to bludgeoning damage, vulnerability to piercing damage. */
export default class FormulaUnbreakable extends _Mutagen {

  get effects(): IDDBEffectHint[] {
    return [
      this.mutagenEffect({
        changes: [
          DDBEnricherData.ChangeHelper.damageResistanceChange("bludgeoning"),
          DDBEnricherData.ChangeHelper.damageVulnerabilityChange("piercing"),
        ],
      }),
    ];
  }

}
