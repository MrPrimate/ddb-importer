import DDBEnricherData from "../data/DDBEnricherData";

export default class GrayGaze extends DDBEnricherData {

  override get activity(): IDDBActivityData {
    return {
      targetType: "creature",
      targetCount: 1,
      data: {
        save: { ability: ["con"], dc: { calculation: "spellcasting", formula: "" } },
        damage: {
          onSave: "none",
          parts: [DDBEnricherData.basicDamagePart({ customFormula: "@prof", type: "necrotic", scalingMode: "none" })],
        },
      },
    };
  }

  override get effects(): IDDBEffectHint[] {
    // "Disadvantage on the next Dexterity saving throw it makes before the end of its next turn"
    return [
      {
        name: "Stiffened",
        ac5eOnly: true,
        options: { expiry: "targetEnd" },
        ac5eChanges: [
          DDBEnricherData.ChangeHelper.ac5eChange("once; ability.dex", 20, "flags.automated-conditions-5e.save.disadvantage"),
        ],
      },
      {
        name: "Stiffened",
        ac5eNever: true,
        // without AC5e the disadvantage covers every Dexterity save until the expiry
        options: { expiry: "targetEnd" },
        changes: [
          DDBEnricherData.ChangeHelper.disadvantageAbilitySaveChange("dex"),
        ],
      },
    ];
  }

}
