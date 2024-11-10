/* eslint-disable class-methods-use-this */
import DDBEnricherMixin from "../mixins/DDBEnricherMixin.mjs";

export default class BelashyrrasBeholderCrown extends DDBEnricherMixin {

  get effects() {
    return [
      {
        changes: [
          DDBEnricherMixin.generateUpgradeChange(120, 10, "system.attributes.senses.darkvision"),
        ],
      },
    ];
  }

}
