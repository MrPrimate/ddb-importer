import DDBEnricherData from "../../data/DDBEnricherData";
import _Mutagen from "./_Mutagen";

/** Resistance to piercing damage, vulnerability to slashing damage. */
export default class FormulaImpermeable extends _Mutagen {

  get effects(): IDDBEffectHint[] {
    return [
      this.mutagenEffect({
        changes: [
          DDBEnricherData.ChangeHelper.damageResistanceChange("piercing"),
          DDBEnricherData.ChangeHelper.damageVulnerabilityChange("slashing"),
        ],
      }),
    ];
  }

}
