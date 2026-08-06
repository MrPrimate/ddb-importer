import DDBEnricherData from "../../data/DDBEnricherData";
import type DDBClassFeatureEnricher from "../../DDBClassFeatureEnricher";

export default class TakeMartialForm extends DDBEnricherData<DDBClassFeatureEnricher> {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  get activity(): IDDBActivityData {
    return {
      name: "Take Martial Form",
      targetType: "self",
      activationType: "special",
      activationCondition: "At the start of your turn",
      addItemConsume: true,
      itemConsumeTargetName: this.ddbEnricher.isParentClass2014 ? "Ki" : "Monk's Focus",
      data: {
        duration: {
          value: "10",
          units: "minute",
        },
      },
    };
  }

  get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Martial Form",
        ignoreTransfer: true,
        activitiesMatch: ["Take Martial Form"],
        options: {
          transfer: true,
          disabled: true,
          durationSeconds: 600,
          description: "Your martial form is manifested. It lasts for 10 minutes, until you use this feature again, or until you have the Incapacitated condition.",
        },
      },
    ];
  }

}
