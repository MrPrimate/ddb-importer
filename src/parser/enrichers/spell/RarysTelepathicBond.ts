import DDBEnricherData from "../data/DDBEnricherData";

/**
 * Rary's Telepathic Bond: the linked creatures can communicate telepathically for the duration.
 */
export default class RarysTelepathicBond extends DDBEnricherData {

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Bonded Telepathy",
        changes: [
          DDBEnricherData.ChangeHelper.unsignedAddChange(";Bonded telepathy", 20, "system.traits.languages.custom"),
        ],
      },
    ];
  }

}
