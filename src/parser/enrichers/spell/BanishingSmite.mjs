/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../data/DDBEnricherData.mjs";

export default class BanishingSmite extends DDBEnricherData {

  get type() {
    return "damage";
  }

  get activity() {
    return {
      data: {
        damage: {
          critical: {
            allow: true,
          },
        },
      },
    };
  }

}
