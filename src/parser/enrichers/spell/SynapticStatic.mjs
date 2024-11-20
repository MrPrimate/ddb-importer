/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../data/DDBEnricherData.mjs";

export default class SynapticStatic extends DDBEnricherData {
  get effects() {
    return [
      {
        name: "Synaptic Static: Muddled Thoughts",
        options: {
          durationSeconds: 60,
        },
        changes: [
          DDBEnricherData.ChangeHelper.unsignedAddChange("-1d6", 20, "system.bonuses.mwak.attack"),
          DDBEnricherData.ChangeHelper.unsignedAddChange("-1d6", 20, "system.bonuses.msak.attack"),
          DDBEnricherData.ChangeHelper.unsignedAddChange("-1d6", 20, "system.bonuses.rwak.attack"),
          DDBEnricherData.ChangeHelper.unsignedAddChange("-1d6", 20, "system.bonuses.rsak.attack"),
          DDBEnricherData.ChangeHelper.unsignedAddChange("-1d6", 20, "system.bonuses.abilities.check"),
          DDBEnricherData.ChangeHelper.unsignedAddChange("-1d6", 20, "system.attributes.concentration.bonuses.save"),
        ],
      },
    ];
  }
}
