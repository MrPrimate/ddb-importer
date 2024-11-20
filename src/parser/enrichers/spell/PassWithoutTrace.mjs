/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../data/DDBEnricherData.mjs";

export default class PassWithoutTrace extends DDBEnricherData {

  get effects() {
    return [
      {
        changes: [
          DDBEnricherData.ChangeHelper.signedAddChange("10", 20, "system.skills.ste.bonuses.check"),
        ],
      },
    ];
  }

}
