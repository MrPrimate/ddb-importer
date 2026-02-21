import DDBEnricherData from "../data/DDBEnricherData";

export default class SpeakWithAnimals extends DDBEnricherData {

  get effects() {
    return [
      {
        name: "Speak With Animals",
      },
    ];
  }

}
