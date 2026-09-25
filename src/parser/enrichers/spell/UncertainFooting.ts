import DDBEnricherData from "../data/DDBEnricherData";

export default class UncertainFooting extends DDBEnricherData {

  override get activity(): IDDBActivityData {
    return { targetCount: "3" };
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Uncertain Footing",
        changes: [DDBEnricherData.ChangeHelper.customChange("/2", 20, "system.attributes.movement.all")],
        options: { durationSeconds: 60, description: "Speed halved and cannot take the Dash action." },
      },
    ];
  }

}
