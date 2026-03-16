import DDBEnricherData from "../../data/DDBEnricherData";

export default class Pseudopod extends DDBEnricherData {
  get activity(): IDDBActivityData {
    return {
      noTemplate: true,
    };
  }

}
