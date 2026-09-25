import Misfortune from "./Misfortune";

export default class MisfortunesCurseOfTheInsensate extends Misfortune {

  override get jinxCost(): number {
    return 3;
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
        name: "Curse of the Insensate",
        statuses: ["Blinded", "Deafened"],
        options: {
          durationSeconds: 60,
          description: "Blinded and Deafened for 1 minute; repeats the save at the end of each of its turns, ending the effect on a success.",
        },
      },
    ];
  }

}
