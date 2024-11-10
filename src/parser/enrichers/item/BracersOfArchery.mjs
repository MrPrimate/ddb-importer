/* eslint-disable class-methods-use-this */
import DDBEnricherMixin from "../mixins/DDBEnricherMixin.mjs";

export default class BracersOfArchery extends DDBEnricherMixin {

  get effects() {
    return [
      {
        noCreate: true,
        changes: [
          DDBEnricherMixin.generateUnsignedAddChange("2", 20, "system.bonuses.rwak.damage"),
        ],
      },
    ];
  }

}
