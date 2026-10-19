import DDBEnricherData from "../data/DDBEnricherData";

export default class OrdersResilience extends DDBEnricherData {

  // Stronger Together depends on a non-Incapacitated ally within 5 feet, so it is a toggle
  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Stronger Together",
        options: { transfer: true, disabled: true },
        changes: [DDBEnricherData.ChangeHelper.advantageAbilitySaveChange("str")],
      },
    ];
  }

}
