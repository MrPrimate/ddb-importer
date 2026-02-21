import DDBEnricherData from "../data/DDBEnricherData";

export default class None extends DDBEnricherData {

  get type() {
    return "none";
  }

  get additionalActivities() {
    return [];
  }

}
