import DDBEnricherData from "../data/DDBEnricherData";

export default class FracturedAwareness extends DDBEnricherData {

  override get activity(): IDDBActivityData {
    return { data: { damage: { onSave: "half" } } };
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Fractured Awareness",
        changes: [DDBEnricherData.ChangeHelper.ruleDisadvantageChange("d20")],
        options: { durationSeconds: 60, description: "Disadvantage on D20 Tests." },
      },
    ];
  }

}
