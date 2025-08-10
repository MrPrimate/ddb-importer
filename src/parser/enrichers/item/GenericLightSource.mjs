/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../data/DDBEnricherData.mjs";

export default class GenericLightSource extends DDBEnricherData {

  get activity() {
    return {
      name: "Light",
      noTemplate: true,
    };
  }

}
