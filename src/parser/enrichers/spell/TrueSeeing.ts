import DDBEnricherData from "../data/DDBEnricherData";

/**
 * True Seeing: the target gains Truesight to 120 feet for the duration.
 */
export default class TrueSeeing extends DDBEnricherData {

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Truesight",
        changes: [
          DDBEnricherData.ChangeHelper.upgradeChange("120", 20, "system.attributes.senses.truesight"),
        ],
      },
    ];
  }

}
