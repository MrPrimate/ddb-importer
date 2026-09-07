import DDBEnricherData from "../../data/DDBEnricherData";
import _Mutagen from "./_Mutagen";

/**
 * Darkvision out to 60 feet, or 60 feet further if you already have it - both cases are an
 * addition to the existing range.
 *
 * The sunlight disadvantage is conditional on the light the blood hunter, their target or
 * whatever they are perceiving is standing in, so it is left to the description.
 */
export default class FormulaNighteye extends _Mutagen {

  override get effects(): IDDBEffectHint[] {
    return [
      this.mutagenEffect({
        changes: [
          DDBEnricherData.ChangeHelper.unsignedAddChange("60", 20, "system.attributes.senses.darkvision"),
        ],
      }),
    ];
  }

}
