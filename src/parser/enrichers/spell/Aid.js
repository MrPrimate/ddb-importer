/* eslint-disable class-methods-use-this */
import DDBEnricherMixin from "../mixins/DDBEnricherMixin.mjs";

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
