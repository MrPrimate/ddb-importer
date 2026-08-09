import DDBEnricherData from "../../data/DDBEnricherData";

export default class SuperiorCritical extends DDBEnricherData {

  override get effects(): IDDBEffectHint[] {
    return [
      {
        options: {
          transfer: true,
        },
        changes: [
          DDBEnricherData.ChangeHelper.downgradeChange("18", 30, "flags.dnd5e.weaponCriticalThreshold"),
        ],
      },
    ];
  }

}
