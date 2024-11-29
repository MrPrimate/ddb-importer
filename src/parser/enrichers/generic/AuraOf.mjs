/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../data/DDBEnricherData.mjs";

export default class AuraOf extends DDBEnricherData {

  get effects() {
    if (!this.isClass("Paladin")) return [];
    return [
      {
        noCreate: true,
        data: {
          flags: {
            "dae.stackable": "noneName",
            ActiveAuras: {
              aura: "Allies",
              radius: `@scale.paladin.${this.data.name.toLowerCase().replaceAll(" ", "-")}`,
              isAura: true,
              inactive: false,
              hidden: false,
              displayTemp: true,
            },
          },
        },
      },
    ];
  }

}
