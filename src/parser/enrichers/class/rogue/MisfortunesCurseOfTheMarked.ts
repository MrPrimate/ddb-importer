import Misfortune from "./Misfortune";

export default class MisfortunesCurseOfTheMarked extends Misfortune {

  override get jinxCost(): number {
    return 2;
  }

  override get activity(): IDDBActivityData {
    return {
      ...super.activity,
      activationType: "bonus",
    };
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Curse of the Marked",
        statuses: ["Marked"],
        options: {
          durationSeconds: 3600,
          description: "Evil Eye curse extended to 1 hour; the rogue always knows the direction and distance to this creature while on the same plane.",
        },
      },
    ];
  }

}
