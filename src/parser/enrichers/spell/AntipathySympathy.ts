import DDBEnricherData from "../data/DDBEnricherData";

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
