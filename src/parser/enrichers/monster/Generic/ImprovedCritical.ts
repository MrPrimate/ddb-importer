import DDBEnricherData from "../../data/DDBEnricherData";

export default class ImprovedCritical extends DDBEnricherData {

  override get effects(): IDDBEffectHint[] {
    return [
      {
        options: {
          transfer: true,
        },
        name: this.name,
        changes: [
          DDBEnricherData.ChangeHelper.downgradeChange("19", 25, "flags.dnd5e.weaponCriticalThreshold"),
        ],
      },
    ];
  }

}
