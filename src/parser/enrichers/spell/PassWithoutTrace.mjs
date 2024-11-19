/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../data/DDBEnricherData.mjs";

export default class PassWithoutTrace extends DDBEnricherData {

  get effects() {
    return [
      {
        changes: [
          DDBEnricherData.generateSignedAddChange("10", 20, "system.skills.ste.bonuses.check"),
        ],
      },
    ];
  }

}
