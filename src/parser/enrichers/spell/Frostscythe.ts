import DDBEnricherData from "../data/DDBEnricherData";

/**
 * World of Warcraft (Death Knight): a failed save reduces Speed by 10 feet for 1 minute.
 */
export default class Frostscythe extends DDBEnricherData {

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Frostscythe: Slowed",
        options: {
          durationSeconds: 60,
        },
        changes: [
          DDBEnricherData.ChangeHelper.movementBonusChange("-10", 20),
        ],
      },
    ];
  }

}
