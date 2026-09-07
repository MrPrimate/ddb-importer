import DDBEnricherData from "../../data/DDBEnricherData";
import _Mutagen from "./_Mutagen";

/** Speed increases by 10 feet, or 15 from 15th level, at the cost of Intelligence checks. */
export default class FormulaRapidity extends _Mutagen {

  override get effects(): IDDBEffectHint[] {
    const bands: { bonus: string; level: { min: number | null; max: number | null } }[] = [
      { bonus: "10", level: { min: null, max: 14 } },
      { bonus: "15", level: { min: 15, max: null } },
    ];

    return bands.map((band, index) => this.mutagenEffect({
      idPostfix: index,
      level: band.level,
      changes: [
        DDBEnricherData.ChangeHelper.unsignedAddChange(band.bonus, 20, "system.attributes.movement.walk"),
        DDBEnricherData.ChangeHelper.disadvantageAbilityCheckChange("int"),
      ],
    }));
  }

}
