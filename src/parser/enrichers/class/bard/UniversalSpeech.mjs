/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class UniversalSpeech extends DDBEnricherData {

  get effects() {
    return [
      {
        name: "Universal Speech",
        options: {
          descriptions: "You and the caster can understand each other, regardless of language.",
        },
      },
    ];
  }

}
