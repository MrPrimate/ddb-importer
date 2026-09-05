import DDBEnricherData from "../../data/DDBEnricherData";

export default class DraconicFlight extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Draconic Flight",
      activationType: "bonus",
      targetType: "self",
      addItemConsume: true,
      data: {
        duration: {
          value: "10",
          units: "minute",
        },
      },
    };
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Draconic Flight",
        options: {
          durationSeconds: 600,
          description: "Spectral wings give you a Fly Speed equal to your Speed for 10 minutes, until you retract them, or until you have the Incapacitated condition.",
        },
        changes: [
          DDBEnricherData.ChangeHelper.upgradeChange("@attributes.movement.speeds.walk", 20, "system.attributes.movement.speeds.fly"),
        ],
      },
    ];
  }

}
