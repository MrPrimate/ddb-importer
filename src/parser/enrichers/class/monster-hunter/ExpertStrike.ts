import DDBEnricherData from "../../data/DDBEnricherData";

export default class ExpertStrike extends DDBEnricherData {

  override get clearAutoEffects(): boolean {
    return true;
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Expert Strike",
        options: {
          transfer: true,
        },
        changes: [
          DDBEnricherData.ChangeHelper.unsignedAddChange("@abilities.int.mod", 20, "system.rolls.attack.mwak.bonus"),
          DDBEnricherData.ChangeHelper.unsignedAddChange("@abilities.int.mod", 20, "system.rolls.damage.mwak.bonus"),
          DDBEnricherData.ChangeHelper.unsignedAddChange("@abilities.int.mod", 20, "system.rolls.attack.rwak.bonus"),
          DDBEnricherData.ChangeHelper.unsignedAddChange("@abilities.int.mod", 20, "system.rolls.damage.rwak.bonus"),
        ],
      },
    ];
  }

}
