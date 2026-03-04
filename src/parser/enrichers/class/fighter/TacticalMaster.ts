import DDBEnricherData from "../../data/DDBEnricherData";

export default class TacticalMaster extends DDBEnricherData {

  get effects(): IDDBEffectHint[] {
    return [
      {
        options: {
          transfer: true,
        },
        changes: [
          DDBEnricherData.ChangeHelper.unsignedAddChange("push", 10, "system.traits.weaponProf.mastery.bonus"),
          DDBEnricherData.ChangeHelper.unsignedAddChange("sap", 10, "system.traits.weaponProf.mastery.bonus"),
          DDBEnricherData.ChangeHelper.unsignedAddChange("slow", 10, "system.traits.weaponProf.mastery.bonus"),
        ],
      },
    ];
  }

}
