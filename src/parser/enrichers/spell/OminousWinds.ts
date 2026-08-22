import DDBEnricherData from "../data/DDBEnricherData";

export default class OminousWinds extends DDBEnricherData {

  override get effects(): IDDBEffectHint[] {
    return [
      {
        options: {
          durationSeconds: 60,
        },
        changes: [
          DDBEnricherData.ChangeHelper.signedAddChange("-1d12", 0, "system.rolls.attack.mwak.bonus"),
          DDBEnricherData.ChangeHelper.signedAddChange("-1d12", 0, "system.rolls.attack.rwak.bonus"),
          DDBEnricherData.ChangeHelper.signedAddChange("-1d12", 0, "system.rolls.attack.msak.bonus"),
          DDBEnricherData.ChangeHelper.signedAddChange("-1d12", 0, "system.rolls.attack.rsak.bonus"),
          DDBEnricherData.ChangeHelper.signedAddChange("-1d12", 20, "system.rolls.ability.save.bonus"),
        ],
      },
    ];
  }

}
