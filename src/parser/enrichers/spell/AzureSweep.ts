import DDBEnricherData from "../data/DDBEnricherData";

/**
 * World of Warcraft (Evoker): a failed save reduces Speed by 20 feet for the duration.
 */
export default class AzureSweep extends DDBEnricherData {

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Azure Sweep: Slowed",
        options: {
          durationSeconds: 60,
        },
        changes: [
          DDBEnricherData.ChangeHelper.movementBonusChange("-20", 20),
        ],
      },
    ];
  }

}
