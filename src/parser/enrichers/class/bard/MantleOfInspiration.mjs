/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class MantleOfInspiration extends DDBEnricherData {
  get type() {
    return "heal";
  }

  get activity() {
    return {
      data: {
        "description.chatFlavor":
          "Each creature can immediately use its reaction to move up to its speed, without provoking opportunity attacks.",
        "range.units": "self",
        target: {
          template: {
            count: "",
            contiguous: false,
            type: "radius",
            size: "60",
            width: "",
            height: "",
            units: "ft",
          },
          affects: {
            count: "@abilities.cha.mod",
            type: "ally",
            choice: true,
            special: "",
          },
          prompt: false,
        },
        healing: DDBEnricherData.basicDamagePart({
          customFormula: "2 * @scale.glamour.mantle-of-inspiration",
          types: ["temphp"],
        }),
      },
    };
  }

  get setMidiOnUseMacroFlag() {
    return {
      type: "feat",
      name: "mantleOfInspiration.js",
      triggerPoints: ["preTargeting"],
    };
  }

  get itemMacro() {
    return {
      type: "feat",
      name: "mantleOfInspiration.js",
    };
  }

}
