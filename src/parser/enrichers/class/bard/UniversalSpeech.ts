import DDBEnricherData from "../../data/DDBEnricherData";

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
