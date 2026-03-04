import DDBEnricherData from "../../data/DDBEnricherData";

export default class LayOnHandsPool extends DDBEnricherData {

  get type() {
    return null;
  }

  get activity() {
    return null;
  }

  get effects(): IDDBEffectHint[] {
    return [];
  }

  get additionalActivities(): IDDBAdditionalActivity[] {
    return [];
  }

  get override(): IDDBOverrideData {
    return {
      data: {
        name: "Lay On Hands",
      },
    };
  }

}
