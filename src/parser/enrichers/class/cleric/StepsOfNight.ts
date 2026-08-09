import DDBEnricherData from "../../data/DDBEnricherData";

export default class StepsOfNight extends DDBEnricherData {

  override get addAutoAdditionalActivities() {
    return true;
  }

  override get activity(): IDDBActivityData {
    return {
      targetType: "self",
    };
  }

  override get effects(): IDDBEffectHint[] {
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
