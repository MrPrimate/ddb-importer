import DDBEnricherData from "../data/DDBEnricherData";

export default class GenericLightSource extends DDBEnricherData {

  get activity() {
    return {
      name: "Light",
      noTemplate: true,
    };
  }

}
