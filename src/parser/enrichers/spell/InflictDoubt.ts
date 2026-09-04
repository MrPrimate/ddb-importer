import DDBEnricherData from "../data/DDBEnricherData";

export default class InflictDoubt extends DDBEnricherData {

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Doubt",
        changes: [DDBEnricherData.ChangeHelper.ruleDisadvantageChange("d20")],
        options: { durationSeconds: 60, description: "Disadvantage on D20 Tests." },
      },
    ];
  }

}
