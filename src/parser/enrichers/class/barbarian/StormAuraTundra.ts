import DDBEnricherData from "../../data/DDBEnricherData";

export default class StormAuraTundra extends DDBEnricherData {
  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.HEAL;
  }

  get activity(): IDDBActivityData {
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
          customFormula: `@scale.${this.subclassIdentifier("Path of the Storm Herald")}.storm-aura-tundra`,
          types: ["temphp"],
        }),
      },
    };
  }

  get effects(): IDDBEffectHint[] {
    return [
      {
        midiOnly: true,
        onUseMacroChanges: [
          {
            macroPass: "postActiveEffects",
            macroType: "feat",
            macroName: "stormAuraTundra.js",
            document: this.data,
          },
        ],
      },
    ];
  }

  get itemMacro() {
    return {
      type: "feat",
      name: "stormAuraTundra.js",
    };
  }
}
