import DDBEnricherData from "../data/DDBEnricherData";

export default class SpeakWithAnimals extends DDBEnricherData {

  override get effects(): IDDBEffectHint[] {
    return [
      {
        // not a concentration spell, so an effect makes the duration trackable
        name: "Speak With Animals",
        options: {
          durationSeconds: 600,
        },
      },
    ];
  }

}
