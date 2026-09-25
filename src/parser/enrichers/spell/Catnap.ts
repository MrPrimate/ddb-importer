import DDBEnricherData from "../data/DDBEnricherData";

export default class Catnap extends DDBEnricherData {

  override get clearAutoEffects(): boolean {
    return true;
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Catnap",
        statuses: ["Unconscious"],
        options: {
          durationSeconds: 600,
          description: "Ends early on damage or if shaken awake; a full duration grants a Short Rest.",
        },
      },
    ];
  }

}
