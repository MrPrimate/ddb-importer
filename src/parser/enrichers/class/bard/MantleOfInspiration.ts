import DDBEnricherData from "../../data/DDBEnricherData";

export default class MantleOfInspiration extends DDBEnricherData {
  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.HEAL;
  }

  get activity(): IDDBActivityData {
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
          customFormula: this.is2014 ? "@scale.glamour.mantle-of-inspiration" : "2 * @scale.glamour.mantle-of-inspiration",
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
