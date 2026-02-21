import DDBEnricherData from "../../data/DDBEnricherData";

export default class LayOnHandsPool extends DDBEnricherData {

  get type() {
    return null;
  }

  get activity() {
    return null;
  }

  get effects() {
    return [];
  }

  get additionalActivities() {
    return [];
  }

  get override() {
    return {
      data: {
        name: "Lay On Hands",
      },
    };
  }

}
