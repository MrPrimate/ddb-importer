/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class StormAuraTundra extends DDBEnricherData {
  get type() {
    return "heal";
  }

  get activity() {
    return {
      activationType: "bonus",
      rangeSelf: true,
      data: {
        target: {
          affects: {
            type: "ally",
          },
          template: {
            contiguous: false,
            type: "radius",
            size: "10",
            units: "ft",
          },
        },
        healing: DDBEnricherData.basicDamagePart({
          customFormula: "@scale.path-of-the-storm-herald.storm-aura-tundra",
          types: ["temphp"],
        }),
      },
    };
  }
}
