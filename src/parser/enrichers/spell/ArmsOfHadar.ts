import DDBEnricherData from "../data/DDBEnricherData";

/** A failed save takes the target's Reactions until the start of its next turn (2014: "until its next turn"). */
export default class ArmsOfHadar extends DDBEnricherData {

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Arms of Hadar: No Reactions",
        options: {
          expiry: "targetStart",
          description: "Can't take Reactions until the start of its next turn.",
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
