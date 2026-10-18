import DDBEnricherData from "../data/DDBEnricherData";

/**
 * A failed save takes the target's reaction until the end of its next turn. The one-of-move,
 * action or bonus action limit on that turn has no automation and stays in the description.
 */
export default class TashasMindWhip extends DDBEnricherData {

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Mind Whip: No Reactions",
        options: {
          expiry: "targetEnd",
          description: "Can't take a reaction until the end of its next turn, and on that turn gets only one of a move, an action or a bonus action.",
        },
        midiChanges: [
          DDBEnricherData.ChangeHelper.midiNoReactionsChange(),
        ],
        ac5eChanges: [
          DDBEnricherData.ChangeHelper.ac5eNoReactionsChange(),
        ],
      },
    ];
  }

}
