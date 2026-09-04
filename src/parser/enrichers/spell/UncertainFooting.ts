import DDBEnricherData from "../data/DDBEnricherData";

export default class UncertainFooting extends DDBEnricherData {

  override get activity(): IDDBActivityData {
    return { targetCount: "3" };
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Uncertain Footing",
        changes: [DDBEnricherData.ChangeHelper.movementMultiplierChange("0.5", 20)],
        options: { durationSeconds: 60, description: "Speed halved and cannot take the Dash action." },
      },
    ];
  }

}
