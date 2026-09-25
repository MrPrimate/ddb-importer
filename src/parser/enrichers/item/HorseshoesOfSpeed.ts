import DDBEnricherData from "../data/DDBEnricherData";

/**
 * Horseshoes of Speed: +30 feet of speed on the wearer (walking speed in 2014, every speed in 2024).
 */
export default class HorseshoesOfSpeed extends DDBEnricherData {
  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Faster",
        changes: [
          // 2014 raises the walking speed; the 2024 reprint says "Speed", which targets every speed
          this.is2014
            ? DDBEnricherData.ChangeHelper.unsignedAddChange("30", 20, "system.attributes.movement.walk")
            : DDBEnricherData.ChangeHelper.customChange("+30", 20, "system.attributes.movement.all"),
        ],
        options: {
          transfer: false,
          description: "Attached to a creature with four hooves.",
        },
      },
    ];
  }

}
