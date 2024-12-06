/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class SmiteOfProtection extends DDBEnricherData {
  get effects() {
    return [
      {
        statuses: ["coverHalf"],
        options: {
          duration: {
            rounds: 1,
          },
        },
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
