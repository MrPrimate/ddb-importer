/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../data/DDBEnricherData.mjs";

export default class Aid extends DDBEnricherData {

  get effects() {
    return [2, 3, 4, 5, 6, 7, 8, 9].map((level) => {
      return {
        name: `Aid: Level ${level} Temp Max HP Bonus`,
        changes: [
          DDBEnricherData.ChangeHelper.unsignedAddChange(`${5 * (level - 1)}`, 20, "system.attributes.hp.bonuses.overall"),
        ],
      };
    });
  }

}
