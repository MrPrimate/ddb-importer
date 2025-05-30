/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class TwinklingConstellations extends DDBEnricherData {
  get type() {
    return "utility";
  }

  get activity() {
    return {
      noTemplate: true,
      targetType: "self",
      noConsumeTargets: true,
      noeffect: true,
      activationType: "special",
      activationCondition: "Start of each turn",
    };
  }

  get effects() {
    return [
      {
        name: "Twinkling Constellations (Level 10)",
        changes: [
          DDBEnricherData.ChangeHelper.upgradeChange("20", 20, "system.attributes.movement.fly"),
          DDBEnricherData.ChangeHelper.upgradeChange("true", 20, "system.attributes.movement.hover"),
        ],
      },
    ];
  }

  get useDefaultAdditionalActivities() {
    return true;
  }

}
