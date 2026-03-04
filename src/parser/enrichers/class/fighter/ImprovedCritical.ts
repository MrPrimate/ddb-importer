import DDBEnricherData from "../../data/DDBEnricherData";

export default class ImprovedCritical extends DDBEnricherData {

  get effects(): IDDBEffectHint[] {
    return [
      {
        options: {
          transfer: true,
        },
        changes: [
          DDBEnricherData.ChangeHelper.downgradeChange("19", 25, "flags.dnd5e.weaponCriticalThreshold"),
        ],
      },
    ];
  }

}
