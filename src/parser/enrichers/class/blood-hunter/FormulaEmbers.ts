import DDBEnricherData from "../../data/DDBEnricherData";
import _Mutagen from "./_Mutagen";

/** Resistance to fire damage, vulnerability to cold damage. */
export default class FormulaEmbers extends _Mutagen {

  override get effects(): IDDBEffectHint[] {
    return [
      this.mutagenEffect({
        changes: [
          DDBEnricherData.ChangeHelper.damageResistanceChange("fire"),
          DDBEnricherData.ChangeHelper.damageVulnerabilityChange("cold"),
        ],
      }),
    ];
  }

}
