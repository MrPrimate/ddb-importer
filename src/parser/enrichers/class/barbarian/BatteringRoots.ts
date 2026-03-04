import DDBEnricherData from "../../data/DDBEnricherData";

export default class BatteringRoots extends DDBEnricherData {

  get effects(): IDDBEffectHint[] {
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
