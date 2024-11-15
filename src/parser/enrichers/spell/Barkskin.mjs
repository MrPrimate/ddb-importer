/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../data/DDBEnricherData.mjs";

export default class Barkskin extends DDBEnricherData {

  get effects() {
    if (this.is2014) {
      return [
        {
          changes: [
            DDBEnricherData.generateUpgradeChange("16", 100, "system.attributes.ac.min"),
          ],
        },
      ];
    } else {
      return [
        {
          changes: [
            DDBEnricherData.generateUpgradeChange("17", 100, "system.attributes.ac.min"),
          ],
        },
      ];
    }
  }

}
