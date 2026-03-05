import DDBEnricherData from "../../data/DDBEnricherData";

export default class BlessedHealer extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.HEAL;
  }

  get activity(): IDDBActivityData {
    return {
      activationType: "special",
      name: "Heal Self",
      targetType: "self",
      addScalingMode: "amount",
      addScalingFormula: "1",
      data: {
        description: {
          chatFlavor: "Choose level of spell for scaling",
        },
        "consumption.scaling": {
          allowed: true,
          max: "9",
        },
        healing: DDBEnricherData.basicDamagePart({
          bonus: "3",
          types: ["healing"],
          scalingMode: "whole",
          scalingFormula: "1",
        }),
      },
    };
  }

  get effects(): IDDBEffectHint[] {
    return [
      {
        type: "item",
        midiOnly: true,
        onUseMacroChanges: [
          {
            macroPass: "postActiveEffects",
            macroType: "feat",
            macroName: "blessedHealer.js",
            document: this.data,
          },
        ],
      },
    ];
  }

  get itemMacro() {
    return {
      type: "feat",
      name: "blessedHealer.js",
    };
  }

  get setMidiOnUseMacroFlag() {
    return {
      type: "feat",
      name: "blessedHealer.js",
      triggerPoints: ["postActiveEffects"],
    };
  }

}
