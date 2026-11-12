import DDBEnricherData from "../data/DDBEnricherData";

/**
 * World of Warcraft (Druid cantrip): a hit reduces Speed by 10 feet until the end of the caster's next turn.
 */
export default class Wrath extends DDBEnricherData {

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Wrath: Slowed",
        options: {
          expiry: "sourceEnd",
        },
        changes: [
          DDBEnricherData.ChangeHelper.movementBonusChange("-10", 20),
        ],
      },
    ];
  }

}
