import DDBEnricherData from "../data/DDBEnricherData";

/**
 * World of Warcraft (Nightborne cantrip): a failed save reduces Speed by 10 feet until the end of the caster's next turn.
 */
export default class ArcanePulse extends DDBEnricherData {

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Arcane Pulse: Slowed",
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
