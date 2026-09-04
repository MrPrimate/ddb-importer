import DDBEnricherData from "../data/DDBEnricherData";

export default class EntrancingMirrors extends DDBEnricherData {

  override get clearAutoEffects(): boolean {
    return true;
  }

  override get activity(): IDDBActivityData {
    return {
      targetCount: "3",
      data: { damage: { onSave: "half" } },
    };
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Entranced",
        statuses: ["Stunned"],
        changes: [DDBEnricherData.ChangeHelper.movementMultiplierChange("0.5", 20)],
        options: { durationSeconds: 60 },
      },
    ];
  }

}
