/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../data/DDBEnricherData.mjs";

export default class SpeakWithAnimals extends DDBEnricherData {

  get effects() {
    return [
      {
        name: "Speak With Animals",
      },
    ];
  }

}
