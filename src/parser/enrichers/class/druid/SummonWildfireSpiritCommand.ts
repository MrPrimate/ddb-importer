import DDBEnricherData from "../../data/DDBEnricherData";

export default class SummonWildfireSpiritCommand extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return null;
  }

  override get activity(): IDDBActivityData | null {
    return null;
  }

  override get effects(): IDDBEffectHint[] {
    return [];
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [];
  }

  override get override(): IDDBOverrideData {
    return {
      uses: {
        spent: null,
        max: "",
      },
    };
  }

}
