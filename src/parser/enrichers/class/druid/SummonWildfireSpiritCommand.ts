import DDBEnricherData from "../../data/DDBEnricherData";

export default class SummonWildfireSpiritCommand extends DDBEnricherData {

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

  get override() {
    return {
      uses: {
        spent: null,
        max: "",
      },
    };
  }

}
