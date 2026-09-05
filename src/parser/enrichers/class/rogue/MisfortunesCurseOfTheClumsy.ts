import Misfortune from "./Misfortune";

export default class MisfortunesCurseOfTheClumsy extends Misfortune {

  override get jinxCost(): number {
    return 3;
  }

  override get activity(): IDDBActivityData {
    return {
      ...super.activity,
      activationType: "reaction",
      activationCondition: "A creature cursed by your Evil Eye moves at least 5 feet on its turn",
    };
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Curse of the Clumsy",
        statuses: ["Prone"],
        options: {
          expiry: "targetEnd",
          description: "Prone with Speed 0 until the end of its turn.",
        },
        changes: [
          Misfortune.ChangeHelper.movementMultiplierChange("0", 90),
        ],
      },
    ];
  }

}
