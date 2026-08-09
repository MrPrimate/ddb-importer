import DDBEnricherData from "../data/DDBEnricherData";

export default class GenericLightSource extends DDBEnricherData {

  override get activity(): IDDBActivityData {
    return {
      name: "Light",
      noTemplate: true,
    };
  }

}
