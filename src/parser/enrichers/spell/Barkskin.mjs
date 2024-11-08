/* eslint-disable class-methods-use-this */
import DDBEnricherMixin from "../mixins/DDBEnricherMixin.mjs";

export default class Barkskin extends DDBEnricherMixin {

  get effects() {
    if (this.is2014) {
      return [
        {
          changes: [
            generateUpgradeChange("16", 100, "system.attributes.ac.min"),
          ],
        },
      ];
    } else {
      return [
        {
          changes: [
            generateUpgradeChange("17", 100, "system.attributes.ac.min"),
          ],
        },
      ];
    }
  }

}
