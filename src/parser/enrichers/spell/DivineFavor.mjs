/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../data/DDBEnricherData.mjs";

export default class DivineFavor extends DDBEnricherData {

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
          DDBEnricherData.generateUnsignedAddChange("1d4[radiant]", 0, "system.bonuses.mwak.damage"),
          DDBEnricherData.generateUnsignedAddChange("1d4[radiant]", 0, "system.bonuses.rwak.damage"),
        ],
      },
    ];
  }

}
