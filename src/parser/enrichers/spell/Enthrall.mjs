/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../data/DDBEnricherData.mjs";

export default class Enthrall extends DDBEnricherData {

  get effects() {
    if (this.is2014) return null;

    return [
      {
        name: "Enthralled",
        changes: [
          DDBEnricherData.ChangeHelper.addChange(
            "-10",
            20,
            "system.skills.prc.bonuses.check",
          ),
        ],
      },
    ];

  }

}
