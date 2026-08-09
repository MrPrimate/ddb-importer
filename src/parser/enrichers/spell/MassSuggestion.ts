import DDBEnricherData from "../data/DDBEnricherData";

export default class MassSuggestion extends DDBEnricherData {

  override get effects(): IDDBEffectHint[] {
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
