import DDBEnricherData from "../data/DDBEnricherData";

export default class Bane extends DDBEnricherData {

  override get effects(): IDDBEffectHint[] {
    return [
      {
        changes: [
          DDBEnricherData.ChangeHelper.signedAddChange("-1d4", 0, "system.rolls.attack.mwak.bonus"),
          DDBEnricherData.ChangeHelper.signedAddChange("-1d4", 0, "system.rolls.attack.rwak.bonus"),
          DDBEnricherData.ChangeHelper.signedAddChange("-1d4", 0, "system.rolls.attack.msak.bonus"),
          DDBEnricherData.ChangeHelper.signedAddChange("-1d4", 0, "system.rolls.attack.rsak.bonus"),
          DDBEnricherData.ChangeHelper.signedAddChange("-1d4", 20, "system.rolls.ability.save.bonus"),
        ],
      },
    ];
  }

}
