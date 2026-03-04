import DDBEnricherData from "../../data/DDBEnricherData";

export default class CelestialRevelationHeavenlyWings extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  get activity() {
    return {
      activationType: "special",
    };
  }

  get effects(): IDDBEffectHint[] {
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
