import DDBEnricherData from "../data/DDBEnricherData";

export default class SynapticStatic extends DDBEnricherData {
  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Synaptic Static: Muddled Thoughts",
        options: {
          durationSeconds: 60,
        },
        changes: [
          DDBEnricherData.ChangeHelper.unsignedAddChange("-1d6", 20, "system.rolls.attack.mwak.bonus"),
          DDBEnricherData.ChangeHelper.unsignedAddChange("-1d6", 20, "system.rolls.attack.msak.bonus"),
          DDBEnricherData.ChangeHelper.unsignedAddChange("-1d6", 20, "system.rolls.attack.rwak.bonus"),
          DDBEnricherData.ChangeHelper.unsignedAddChange("-1d6", 20, "system.rolls.attack.rsak.bonus"),
          DDBEnricherData.ChangeHelper.unsignedAddChange("-1d6", 20, "system.rolls.ability.check.bonus"),
          DDBEnricherData.ChangeHelper.unsignedAddChange("-1d6", 20, "system.attributes.concentration.roll.bonus"),
        ],
      },
    ];
  }
}
