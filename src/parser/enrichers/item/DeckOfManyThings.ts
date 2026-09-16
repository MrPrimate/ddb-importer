import DDBEnricherData from "../data/DDBEnricherData";
import { itemActivity } from "./_ItemActivities";

export default class DeckOfManyThings extends DDBEnricherData {

  override get type(): IDDBActivityType {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get addAutoAdditionalActivities(): boolean {
    return false;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Draw Cards",
      activationType: "special",
      noConsumeTargets: true,
      noTemplate: true,
      rangeSelf: true,
      targetType: "self",
      activationCondition:
        "Declare the number of cards first; resolve each draw and its consequences using the source table. No more than 1 hour between draws.",
      data: this.is2014 ? {} : { roll: { formula: "1d100", prompt: false, visible: true, name: "Card Draw" } },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      itemActivity("Check Deck Size", DDBEnricherData.ACTIVITY_TYPES.UTILITY, {
        activationCondition: "Once when found: 01-75 means thirteen cards; 76-100 means twenty-two",
        data: { roll: { formula: "1d100", prompt: false, visible: true, name: "Deck Size" } },
      }),
    ];
  }

}
