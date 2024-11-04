/* eslint-disable class-methods-use-this */
import DDBEnricherMixin from "../DDBEnricherMixin.js";

export default class Aid extends DDBEnricherMixin {

  get effects() {
    return [2, 3, 4, 5, 6, 7, 8, 9].map((level) => {
      return {
        name: `Aid: Level ${level} Temp Max HP Bonus`,
        changes: [
          DDBEnricherMixin.generateUnsignedAddChange(`${5 * (level - 1)}`, 20, "system.attributes.hp.bonuses.overall"),
        ],
      };
    });
  }

}
