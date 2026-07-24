import DDBEnricherData from "../../data/DDBEnricherData";

export default class SummonWildfireSpiritCommand extends DDBEnricherData {

  get type(): IDDBActivityType | null {
    return null;
  }

  get activity(): IDDBActivityData | null {
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
      uses: {
        spent: null,
        max: "",
      },
    };
  }

}
