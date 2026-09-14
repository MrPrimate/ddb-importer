import DDBEnricherData from "../data/DDBEnricherData";

/**
 * Ioun Stone of Awareness: cannot be surprised, modelled as initiative advantage.
 */
export default class IounStoneOfAwareness extends DDBEnricherData {
  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Enhanced Awareness",
        changes: [
          DDBEnricherData.ChangeHelper.overrideChange("1", 20, "flags.dnd5e.initiativeAdv"),
        ],
        options: {
          transfer: true,
        },
      },
    ];
  }

}
