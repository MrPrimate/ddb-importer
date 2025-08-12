/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../data/DDBEnricherData.mjs";

export default class MindSliver extends DDBEnricherData {

  get effects() {
    return [
      {
        changes: [
          DDBEnricherData.ChangeHelper.addChange("-1d4", 20, "system.bonuses.abilities.save"),
        ],
        daeSpecialDurations: ["isSave"],
      },
    ];
  }

}
