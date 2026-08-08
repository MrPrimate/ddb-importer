import DDBEnricherData from "../../data/DDBEnricherData";
import _Mutagen from "./_Mutagen";

/** Resistance to slashing damage, vulnerability to bludgeoning damage. */
export default class FormulaShielded extends _Mutagen {

  get effects(): IDDBEffectHint[] {
    return [
      this.mutagenEffect({
        changes: [
          DDBEnricherData.ChangeHelper.damageResistanceChange("slashing"),
          DDBEnricherData.ChangeHelper.damageVulnerabilityChange("bludgeoning"),
        ],
      }),
    ];
  }

}
