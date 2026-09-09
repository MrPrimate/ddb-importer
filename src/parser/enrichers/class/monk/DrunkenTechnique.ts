import DDBEnricherData from "../../data/DDBEnricherData";

export default class DrunkenTechnique extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Drunken Technique",
      activationType: "special",
      activationCondition: "When you use Flurry of Blows",
      targetType: "self",
    };
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Drunken Technique",
        changes: [
          DDBEnricherData.ChangeHelper.upgradeChange("10", 20, "system.attributes.movement.walk"),
        ],
        options: {
          expiry: "turnEnd",
          durationRounds: 1,
          description: "You gain the benefit of the Disengage action and your walking speed increases by 10 feet until the end of the current turn.",
        },
      },
    ];
  }

}
