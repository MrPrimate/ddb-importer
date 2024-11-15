/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../data/DDBEnricherData.mjs";

export default class RayOfEnfeeblement extends DDBEnricherData {

  get type() {
    return "attack";
  }

  get effects() {
    return [
      {
        name: "Enfeebled",
        options: {
          description: this.ddbParser?.ddbDefinition?.description ?? "",
        },
      },
    ];
  }

}
