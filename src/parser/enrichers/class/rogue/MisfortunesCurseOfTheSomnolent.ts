import Misfortune from "./Misfortune";

export default class MisfortunesCurseOfTheSomnolent extends Misfortune {

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
      // "someone within 5 feet of it" in the text is not an area; stop the parser building a template
      noTemplate: true,
      data: {
        ...this.wisdomSave,
      },
    };
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Curse of the Somnolent",
        statuses: ["Unconscious"],
        options: {
          durationSeconds: 60,
          description: "Unconscious for 1 minute. Ends if the creature takes damage or someone within 5 feet takes an action to shake it awake.",
        },
      },
    ];
  }

}
