import DDBEnricherData from "../../data/DDBEnricherData";

export default class RagingStormTundra extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.SAVE;
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

  get effects(): IDDBEffectHint[] {
    return [
      {
        changes: [
          DDBEnricherData.ChangeHelper.customChange("*0", 20, "system.attributes.movement.all"),
          DDBEnricherData.ChangeHelper.overrideChange("0", 60, "system.attributes.movement.walk"),
          DDBEnricherData.ChangeHelper.overrideChange("0", 60, "system.attributes.movement.fly"),
        ],
      },
      {
        type: "item",
        midiOnly: true,
        onUseMacroChanges: [
          {
            macroPass: "postActiveEffects",
            macroType: "feat",
            macroName: "ragingStormTundra.js",
            document: this.data,
          },
        ],
      },
    ];
  }

  get itemMacro() {
    return {
      type: "feat",
      name: "ragingStormTundra.js",
    };
  }

}
