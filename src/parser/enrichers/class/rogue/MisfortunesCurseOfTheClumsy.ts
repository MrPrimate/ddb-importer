import Misfortune from "./Misfortune";

export default class MisfortunesCurseOfTheClumsy extends Misfortune {

  get jinxCost(): number {
    return 3;
  }

  get activity(): IDDBActivityData {
    return {
      ...super.activity,
      activationType: "reaction",
      activationCondition: "A creature cursed by your Evil Eye moves at least 5 feet on its turn",
    };
  }

  get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Curse of the Clumsy",
        statuses: ["Prone"],
        options: {
          expiry: "targetEnd",
          description: "Prone with Speed 0 until the end of its turn.",
        },
        changes: [
          Misfortune.ChangeHelper.overrideChange("0", 90, "system.attributes.movement.walk"),
        ],
      },
    ];
  }

}
