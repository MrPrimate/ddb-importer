import DDBEnricherData from "../../data/DDBEnricherData";

export default class StepsOfNight extends DDBEnricherData {

  get addAutoAdditionalActivities() {
    return true;
  }

  get activity(): IDDBActivityData {
    return {
      targetType: "self",
    };
  }

  get effects(): IDDBEffectHint[] {
    return [
      {
        options: {
          durationSeconds: 60,
        },
        changes: [
          DDBEnricherData.ChangeHelper.upgradeChange("@attributes.movement.walk", 20, "system.attributes.movement.fly"),
        ],
      },
    ];
  }

}
