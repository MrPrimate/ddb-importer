import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * Escaped Death (Ravenloft lineages): advantage on death saving throws, which DDB has no
 * modifier for, so it rides on a transfer effect.
 */
export default class EscapedDeath extends DDBEnricherData {

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Escaped Death",
        options: {
          transfer: true,
        },
        changes: [
          DDBEnricherData.ChangeHelper.unsignedAddChange("1", 20, "system.attributes.death.roll.mode"),
        ],
      },
    ];
  }

}
