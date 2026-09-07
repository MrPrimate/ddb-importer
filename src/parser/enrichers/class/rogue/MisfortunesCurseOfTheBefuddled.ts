import Misfortune from "./Misfortune";

export default class MisfortunesCurseOfTheBefuddled extends Misfortune {

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
        range: {
          units: "ft",
          value: "60",
        },
        ...this.wisdomSave,
      },
    };
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Charmed by Curse of the Befuddled",
        statuses: ["Charmed"],
        options: {
          durationSeconds: 600,
          description: "Charmed for 10 minutes or until the rogue or their allies damage this creature.",
        },
      },
    ];
  }

}
