import DDBEnricherData from "../data/DDBEnricherData";

export default class PowerWordStun extends DDBEnricherData {

  override get effects(): IDDBEffectHint[] {
    if (this.is2014) return [];
    return [
      {
        name: "No Movement",
        changes: [
          DDBEnricherData.ChangeHelper.customChange("*0", 20, "system.attributes.movement.all"),
          ...["walk", "fly", "swim", "climb", "burrow"].map((mode) =>
            DDBEnricherData.ChangeHelper.overrideChange("0", 60, `system.attributes.movement.${mode}`)),
        ],
        options: { expiry: "sourceStart" },
      },
    ];
  }

}
