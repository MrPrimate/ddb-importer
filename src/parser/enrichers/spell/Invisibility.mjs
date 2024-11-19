/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../data/DDBEnricherData.mjs";

export default class Invisibility extends DDBEnricherData {

  get effects() {
    return [
      {
        noCreate: true,
        data: {
          "flags.dae.specialDuration": ["1Attack", "1Spell"],
        },
      },
    ];
  }

}
