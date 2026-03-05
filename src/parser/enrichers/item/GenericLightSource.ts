import DDBEnricherData from "../data/DDBEnricherData";

export default class GenericLightSource extends DDBEnricherData {

  get activity(): IDDBActivityData {
    return {
      name: "Light",
      noTemplate: true,
    };
  }

}
