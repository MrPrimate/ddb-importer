/* eslint-disable class-methods-use-this */
import DDBEnricherMixin from "../mixins/DDBEnricherMixin.mjs";

export default class DivineFavor extends DDBEnricherMixin {

  get type() {
    return "utility";
  }

  get activity() {
    return {
      targetType: "self",
    };
  }

  get effects() {
    return [
      {
        changes: [
          DDBEnricherMixin.generateUnsignedAddChange("1d4[radiant]", 0, "system.bonuses.mwak.damage"),
          DDBEnricherMixin.generateUnsignedAddChange("1d4[radiant]", 0, "system.bonuses.rwak.damage"),
        ],
      },
    ];
  }

}
