import DDBEnricherData from "../../data/DDBEnricherData";

export default class BatteringRoots extends DDBEnricherData {

  override get effects(): IDDBEffectHint[] {
    return [
      {
        options: {
          transfer: true,
        },
        changes: [
          DDBEnricherData.ChangeHelper.unsignedAddChange("push", 20, "system.traits.weaponProf.mastery.bonus"),
          DDBEnricherData.ChangeHelper.unsignedAddChange("topple", 20, "system.traits.weaponProf.mastery.bonus"),
        ],
      },
    ];
  }

}
