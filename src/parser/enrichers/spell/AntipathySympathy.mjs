/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../data/DDBEnricherData.mjs";

export default class AntipathySympathy extends DDBEnricherData {

  get effects() {
    return this.is2014
      ? [{}]
      : [
        {
          name: "Antipathy/Sympathy: Charmed",
          statuses: ["Charmed"],
        },
      ];
  }

}
