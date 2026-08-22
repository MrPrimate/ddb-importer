import DDBEnricherData from "../../data/DDBEnricherData";

export default class RagingStormTundra extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.SAVE;
  }

  override get activity(): IDDBActivityData {
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

  override get effects(): IDDBEffectHint[] {
    return [
      {
        changes: [
          DDBEnricherData.ChangeHelper.movementMultiplierChange("0", 20),
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

  override get itemMacro(): IDDBItemMacro {
    return {
      type: "feat",
      name: "ragingStormTundra.js",
    };
  }

}
