/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class RagingStormTundra extends DDBEnricherData {

  get type() {
    return "save";
  }

  get activity() {
    return {
      activationType: "reaction",
      targetType: "creature",
      rangeSelf: true,
      data: {
        save: {
          ability: ["str"],
          dc: {
            calculation: "con",
            formula: "",
          },
        },
        target: {
          affects: {
            count: "1",
            type: "creature",
          },
          template: {
            contiguous: false,
            type: "radius",
            size: "10",
            units: "ft",
          },
          prompt: false,
        },
      },
    };
  }

  get effects() {
    return [
      {
        changes: [
          DDBEnricherData.ChangeHelper.customChange("*0", 20, "system.attributes.movement.all"),
          DDBEnricherData.ChangeHelper.overrideChange("0", 60, "system.attributes.movement.walk"),
          DDBEnricherData.ChangeHelper.overrideChange("0", 60, "system.attributes.movement.fly"),
        ],
      },
    ];
  }

}
