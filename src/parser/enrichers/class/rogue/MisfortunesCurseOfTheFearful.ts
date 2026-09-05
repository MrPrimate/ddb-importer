import Misfortune from "./Misfortune";

export default class MisfortunesCurseOfTheFearful extends Misfortune {

  override get jinxCost(): number {
    return 2;
  }

  override get type(): IDDBActivityType | null {
    return Misfortune.ACTIVITY_TYPES.SAVE;
  }

  override get activity(): IDDBActivityData {
    return {
      ...super.activity,
      activationType: "action",
      data: {
        ...this.wisdomSave,
      },
    };
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Frightened by Curse of the Fearful",
        statuses: ["Frightened"],
        options: {
          durationSeconds: 60,
          description: "Frightened for 1 minute; repeats the save at the end of each of its turns, ending the effect on a success.",
        },
      },
    ];
  }

}
