import DDBEnricherData from "../../data/DDBEnricherData";

export default class GemFlight extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Manifest Wings",
      activationType: "bonus",
      targetType: "self",
      rangeSelf: true,
      addItemConsume: true,
      data: {
        duration: {
          value: "1",
          units: "minute",
        },
      },
    };
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Gem Flight",
        options: {
          durationSeconds: 60,
          description: "Spectral wings give you a flying speed equal to your walking speed, and you can hover.",
        },
        changes: [
          DDBEnricherData.ChangeHelper.upgradeChange("@attributes.movement.walk", 20, "system.attributes.movement.fly"),
          DDBEnricherData.ChangeHelper.overrideChange("true", 20, "system.attributes.movement.hover"),
        ],
      },
    ];
  }

}
