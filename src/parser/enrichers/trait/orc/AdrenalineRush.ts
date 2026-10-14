import DDBEnricherData from "../../data/DDBEnricherData";

export default class AdrenalineRush extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.HEAL;
  }

  override get addAutoAdditionalActivities(): boolean {
    return true;
  }

  // both printings grant Proficiency Bonus temporary hit points with each Dash
  override get activity(): IDDBActivityData {
    return {
      name: "Dash",
      targetSelf: true,
      activationType: "bonus",
      data: {
        healing: DDBEnricherData.basicDamagePart({ customFormula: "@prof", types: ["temphp"] }),
      },
    };
  }

}
