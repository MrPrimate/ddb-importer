import DDBEnricherData from "../../data/DDBEnricherData";

/** The parser kept only the halved Speed of the needle's three riders. */
export default class NumbingNeedle extends DDBEnricherData {

  override get clearAutoEffects(): boolean {
    return true;
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Numbing Needle: Slowed",
        options: {
          expiry: "targetEnd",
          description: "Speed is halved, can't take Reactions, and can take either an action or a Bonus Action on its turn, not both.",
        },
        changes: [
          DDBEnricherData.ChangeHelper.movementMultiplierChange("0.5", 20),
        ],
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
