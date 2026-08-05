import DDBEnricherData from "../../data/DDBEnricherData";

export default class ExpertStrike extends DDBEnricherData {

  get clearAutoEffects(): boolean {
    return true;
  }

  get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Expert Strike",
        options: {
          transfer: true,
        },
        changes: [
          DDBEnricherData.ChangeHelper.unsignedAddChange("@abilities.int.mod", 20, "system.bonuses.mwak.attack"),
          DDBEnricherData.ChangeHelper.unsignedAddChange("@abilities.int.mod", 20, "system.bonuses.mwak.damage"),
          DDBEnricherData.ChangeHelper.unsignedAddChange("@abilities.int.mod", 20, "system.bonuses.rwak.attack"),
          DDBEnricherData.ChangeHelper.unsignedAddChange("@abilities.int.mod", 20, "system.bonuses.rwak.damage"),
        ],
      },
    ];
  }

}
