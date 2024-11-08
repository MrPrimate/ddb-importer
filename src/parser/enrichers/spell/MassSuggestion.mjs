/* eslint-disable class-methods-use-this */
import DDBEnricherMixin from "../mixins/DDBEnricherMixin.mjs";

export default class MassSuggestion extends DDBEnricherMixin {

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
