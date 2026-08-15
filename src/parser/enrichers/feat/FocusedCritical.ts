import DDBEnricherData from "../data/DDBEnricherData";

export default class FocusedCritical extends DDBEnricherData {

  override get effects(): IDDBEffectHint[] {
    return [
      {
        options: {
          transfer: true,
        },
        name: "Focused Critical",
        changes: [
          DDBEnricherData.ChangeHelper.downgradeChange("19", 25, "flags.dnd5e.weaponCriticalThreshold"),
        ],
      },
    ];
  }

}
