import DDBEnricherData from "../data/DDBEnricherData";

/**
 * World of Warcraft (Death Knight): every target's Speed drops to 10 feet until the end of its next turn, whether or not it saves.
 */
export default class RemorselessWinter extends DDBEnricherData {

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Remorseless Winter: Frozen",
        onSave: true,
        options: {
          expiry: "targetEnd",
        },
        changes: [
          ...DDBEnricherData.ChangeHelper.speedCapChanges("10"),
        ],
      },
    ];
  }

}
