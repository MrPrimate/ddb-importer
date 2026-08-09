import DDBEnricherData from "../../data/DDBEnricherData";

export default class Pseudopod extends DDBEnricherData {
  override get activity(): IDDBActivityData {
    return {
      noTemplate: true,
    };
  }

}
