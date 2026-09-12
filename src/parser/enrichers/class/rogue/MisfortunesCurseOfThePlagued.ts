import Misfortune from "./Misfortune";

export default class MisfortunesCurseOfThePlagued extends Misfortune {

  override get jinxCost(): number {
    return 1;
  }

  override get activity(): IDDBActivityData {
    return {
      ...super.activity,
      activationType: "reaction",
      activationCondition: "A creature cursed by your Evil Eye would regain Hit Points",
    };
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Curse of the Plagued",
        options: {
          expiry: "sourceStart",
          description: "Healing halved, then this creature cannot regain Hit Points until the start of the rogue's next turn.",
        },
      },
    ];
  }

}
