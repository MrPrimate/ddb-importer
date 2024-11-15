/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../data/DDBEnricherData.mjs";

export default class BelashyrrasBeholderCrown extends DDBEnricherData {

  get effects() {
    return [
      {
        changes: [
          DDBEnricherData.generateUpgradeChange(120, 10, "system.attributes.senses.darkvision"),
        ],
      },
    ];
  }

}
