import DDBEnricherData from "../data/DDBEnricherData";

export default class ResilientSphere extends DDBEnricherData {

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Encased",
        options: {
          durationSeconds: 60,
        },
        changes: [
          DDBEnricherData.ChangeHelper.movementMultiplierChange("0.5", 20),
          DDBEnricherData.ChangeHelper.customChange("ALL", 20, "system.traits.di.value"),
        ],
      },
    ];
  }
}
