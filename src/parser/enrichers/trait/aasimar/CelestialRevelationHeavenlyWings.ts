import DDBEnricherData from "../../data/DDBEnricherData";

export default class CelestialRevelationHeavenlyWings extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      activationType: "special",
    };
  }

  override get effects(): IDDBEffectHint[] {
    return [{
      options: {
        durationSeconds: 60,
      },
      changes: [
        DDBEnricherData.ChangeHelper.upgradeChange("@attributes.movement.walk", 20, "system.attributes.movement.fly"),
      ],
    }];
  }

}
