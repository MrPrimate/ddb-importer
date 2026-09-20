import DDBEnricherData from "../data/DDBEnricherData";

/**
 * Horseshoes of Speed: +30 feet walking speed on the wearer.
 */
export default class HorseshoesOfSpeed extends DDBEnricherData {
  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Faster",
        changes: [
          DDBEnricherData.ChangeHelper.unsignedAddChange("30", 20, "system.attributes.movement.walk"),
        ],
        options: {
          transfer: false,
          description: "Attached to a creature with four hooves.",
        },
      },
    ];
  }

}
