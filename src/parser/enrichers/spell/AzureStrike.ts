import DDBEnricherData from "../data/DDBEnricherData";

/**
 * World of Warcraft (Evoker): a hit reduces Speed by 10 feet until the end of the target's next turn.
 */
export default class AzureStrike extends DDBEnricherData {

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Azure Strike: Slowed",
        options: {
          expiry: "targetEnd",
        },
        changes: [
          DDBEnricherData.ChangeHelper.movementBonusChange("-10", 20),
        ],
      },
    ];
  }

}
