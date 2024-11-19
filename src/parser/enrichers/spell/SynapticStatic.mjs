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
          DDBEnricherData.generateUnsignedAddChange("-1d6", 20, "system.bonuses.mwak.attack"),
          DDBEnricherData.generateUnsignedAddChange("-1d6", 20, "system.bonuses.msak.attack"),
          DDBEnricherData.generateUnsignedAddChange("-1d6", 20, "system.bonuses.rwak.attack"),
          DDBEnricherData.generateUnsignedAddChange("-1d6", 20, "system.bonuses.rsak.attack"),
          DDBEnricherData.generateUnsignedAddChange("-1d6", 20, "system.bonuses.abilities.check"),
          DDBEnricherData.generateUnsignedAddChange("-1d6", 20, "system.attributes.concentration.bonuses.save"),
        ],
      },
    ];
  }
}
