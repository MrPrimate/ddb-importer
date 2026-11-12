import DDBEnricherData from "../data/DDBEnricherData";

/**
 * World of Warcraft (Death Knight): a failed save halves the target's Speed until the end of its next turn.
 */
export default class ChainsOfIce extends DDBEnricherData {

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Chains of Ice: Slowed",
        options: {
          expiry: "targetEnd",
        },
        changes: [
          DDBEnricherData.ChangeHelper.customChange("/2", 20, "system.attributes.movement.all"),
        ],
      },
    ];
  }

}
