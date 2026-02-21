import DDBEnricherData from "../data/DDBEnricherData";

export default class MassSuggestion extends DDBEnricherData {

  get effects() {
    if (this.is2014) {
      return [];
    } else {
      return [
        {
          statuses: ["Charmed"],
        },
      ];
    }
  }

}
