import DDBEnricherData from "../data/DDBEnricherData";

export default class SpeakWithAnimals extends DDBEnricherData {

  get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Speak With Animals",
      },
    ];
  }

}
